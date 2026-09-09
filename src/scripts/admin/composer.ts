import type { Block } from '../../lib/blocks';

/**
 * Reorders one block. Returns the original array untouched when the target
 * index is out of range -- silently dropping a block the owner just wrote
 * would be far worse than a click that does nothing.
 */
export function moveBlock(blocks: Block[], from: number, to: number): Block[] {
  if (from < 0 || from >= blocks.length) return blocks;
  if (to < 0 || to >= blocks.length) return blocks;
  const next = [...blocks];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function removeBlock(blocks: Block[], index: number): Block[] {
  if (index < 0 || index >= blocks.length) return blocks;
  return blocks.filter((_, i) => i !== index);
}
