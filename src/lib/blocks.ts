export type Block =
  | { type: 'text'; value: string }
  | { type: 'image'; value: string; caption?: string };

const WORDS_PER_MINUTE = 200;

export function readingTime(blocks: Block[]): number {
  const words = blocks
    .filter((b): b is Extract<Block, { type: 'text' }> => b.type === 'text')
    .reduce((n, b) => n + b.value.trim().split(/\s+/).filter(Boolean).length, 0);
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function deriveExcerpt(blocks: Block[], max = 160): string {
  const first = blocks.find((b) => b.type === 'text');
  if (!first) return '';
  const text = first.value.trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const at = cut.lastIndexOf(' ');
  return `${(at > 0 ? cut.slice(0, at) : cut).replace(/[.,;:]$/, '')}…`;
}
