import { describe, it, expect, vi } from 'vitest';
import { AtmosVector } from '../src/core/vector';

const mockVectorize = {
  upsert: vi.fn().mockResolvedValue(undefined),
  query: vi.fn().mockResolvedValue({
    matches: [
      { id: 'vec1', score: 0.95, metadata: { _table: 'users' } }
    ]
  }),
  deleteByIds: vi.fn().mockResolvedValue(undefined),
  getByIds: vi.fn().mockResolvedValue([
    { id: 'vec1', values: [0.1], metadata: {} }
  ])
} as any;

describe('AtmosVector', () => {
  const vector = new AtmosVector(mockVectorize);

  it('upserts vectors', async () => {
    await vector.upsert('vec1', [0.1, 0.2]);
    expect(mockVectorize.upsert).toHaveBeenCalled();
  });

  it('queries vectors', async () => {
    const res = await vector.query([0.1]);
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('vec1');
    expect(res[0].score).toBe(0.95);
  });

  it('deletes vectors', async () => {
    await vector.deleteById('vec1');
    expect(mockVectorize.deleteByIds).toHaveBeenCalledWith(['vec1']);
  });
});
