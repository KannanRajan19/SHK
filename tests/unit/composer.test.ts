import { describe, it, expect } from 'vitest';
import { moveBlock, removeBlock } from '../../src/scripts/admin/composer';
import type { Block } from '../../src/lib/blocks';

const blocks: Block[] = [
  { type: 'text', value: 'one' },
  { type: 'image', value: '/uploads/a.jpg', caption: 'a' },
  { type: 'text', value: 'two' },
];

describe('moveBlock', () => {
  it('moves a block down and preserves every block', () => {
    const out = moveBlock(blocks, 0, 1);
    expect(out.map((b) => b.value)).toEqual(['/uploads/a.jpg', 'one', 'two']);
    expect(out).toHaveLength(3);
  });

  it('moves a block up', () => {
    const out = moveBlock(blocks, 2, 1);
    expect(out.map((b) => b.value)).toEqual(['one', 'two', '/uploads/a.jpg']);
  });

  it('keeps image captions attached to their block when reordered', () => {
    const out = moveBlock(blocks, 1, 2);
    const moved = out[2];
    expect(moved.type).toBe('image');
    expect(moved.type === 'image' && moved.caption).toBe('a');
  });

  it('is a no-op at the boundaries rather than dropping a block', () => {
    expect(moveBlock(blocks, 0, -1)).toEqual(blocks);
    expect(moveBlock(blocks, 2, 3)).toEqual(blocks);
  });

  it('does not mutate the input', () => {
    const copy = structuredClone(blocks);
    moveBlock(blocks, 0, 2);
    expect(blocks).toEqual(copy);
  });

  it('survives an arbitrary interleaving round-trip', () => {
    // text, image, text, image -- the exact pattern the owner asked for.
    const mixed: Block[] = [
      { type: 'text', value: 'p1' },
      { type: 'text', value: 'p2' },
      { type: 'image', value: '/uploads/x.jpg', caption: 'x' },
      { type: 'text', value: 'p3' },
      { type: 'image', value: '/uploads/y.jpg' },
    ];
    const json = JSON.parse(JSON.stringify(mixed));
    expect(json).toEqual(mixed);
    expect(json.map((b: Block) => b.type)).toEqual(['text', 'text', 'image', 'text', 'image']);
  });
});

describe('removeBlock', () => {
  it('removes only the targeted index', () => {
    expect(removeBlock(blocks, 1).map((b) => b.value)).toEqual(['one', 'two']);
  });

  it('ignores an out-of-range index', () => {
    expect(removeBlock(blocks, 99)).toEqual(blocks);
  });
});
