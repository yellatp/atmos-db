import { describe, it, expect, vi } from 'vitest';
import { AtmosDB } from '../src/core/db';

const mockD1 = {
  prepare: vi.fn().mockReturnThis(),
  bind: vi.fn().mockReturnThis(),
  run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
  first: vi.fn().mockResolvedValue({ 
    id: '123', 
    data: JSON.stringify({ name: 'Test' }),
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }),
  all: vi.fn().mockResolvedValue({
    results: [
      { id: '123', data: JSON.stringify({ name: 'Test' }), created_at: '2024', updated_at: '2024' }
    ]
  })
} as any;

describe('AtmosDB', () => {
  const db = new AtmosDB(mockD1);

  it('inserts records', async () => {
    const res = await db.insert('users', { name: 'Test' });
    expect(res.data.name).toBe('Test');
    expect(mockD1.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT'));
  });

  it('finds by id', async () => {
    const res = await db.findById('users', '123');
    expect(res?.id).toBe('123');
    expect(res?.data.name).toBe('Test');
  });

  it('deletes records', async () => {
    const success = await db.delete('users', '123');
    expect(success).toBe(true);
  });

  it('runs raw queries', async () => {
    const res = await db.raw('SELECT 1');
    expect(res.results.length).toBe(1);
  });
});
