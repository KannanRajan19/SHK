/*
 * Cursor ink trail — ported from design/paper-sky.html.
 *
 * Two changes from the prototype, and no others:
 *   1. The colour is hardcoded to rosewine's trail RGB instead of being
 *      pushed in by the tweaks panel, so __setTrailColor/__setTrailEnabled
 *      are gone along with the panel itself.
 *   2. The whole thing is skipped when the reader prefers reduced motion.
 *
 * The per-segment alpha formula is deliberately unchanged. The palette's
 * trail value carried an 0.4 alpha, but the prototype's parseRGB discarded
 * it and derived alpha from point life instead — so matching the prototype
 * means keeping the formula, not the 0.4.
 */
(function initTrail() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTrail);
    return;
  }
  const canvas = document.getElementById('trail');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let DPR = Math.min(window.devicePixelRatio || 1, 2);
  const baseRGB = '176, 118, 130';

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * DPR);
    canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  const points = [];
  const MAX = 32;
  function onMove(e) {
    points.push({ x: e.clientX * DPR, y: e.clientY * DPR, life: 1 });
    if (points.length > MAX) points.shift();
  }
  window.addEventListener('pointermove', onMove, { passive: true, capture: true });
  window.addEventListener('mousemove', onMove, { passive: true, capture: true });

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (points.length > 1) {
      for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        const a = p2.life * (0.4 + (i / points.length) * 0.6);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(${baseRGB}, ${a.toFixed(3)})`;
        ctx.lineWidth = (2.5 + (i / points.length) * 2) * DPR;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }
    for (const p of points) p.life *= 0.96;
    while (points.length && points[0].life < 0.05) points.shift();
    requestAnimationFrame(draw);
  }
  draw();
})();
