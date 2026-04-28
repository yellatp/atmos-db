import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Atmos } from '../src/index';

const mockConfig = {
  bindings: {
    db: {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
      first: vi.fn(),
      all: vi.fn().mockResolvedValue({ results: [] })
    } as any,
    vectorize: {
      upsert: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue({ matches: [] }),
      deleteByIds: vi.fn().mockResolvedValue(undefined)
    } as any,
    ai: {
      run: vi.fn().mockResolvedValue({ data: [[0.1, 0.2]] })
    } as any
  },
  options: {
    autoEmbed: true
  }
};

describe('Atmos Integration Flow', () => {
  let atmos: Atmos;

  beforeEach(() => {
    vi.clearAllMocks();
    atmos = new Atmos(mockConfig);
  });

  it('completes a full lifecycle: set, search, and remove', async () => {
    // 1. Set
    const data = { name: 'Test User', bio: 'I love Cloudflare Workers.' };
    const record = await atmos.set('users', data);
    
    expect(record.id).toBeDefined();
    expect(mockConfig.bindings.db.run).toHaveBeenCalled();
    expect(mockConfig.bindings.vectorize.upsert).toHaveBeenCalled();

    // 2. Search
    // Mocking vector search results
    mockConfig.bindings.vectorize.query.mockResolvedValue({
      matches: [{ id: record.id, score: 0.9, metadata: { _table: 'users' } }]
    });
    // Mocking D1 findById return
    mockConfig.bindings.db.first.mockResolvedValue({
      id: record.id,
      data: JSON.stringify(data),
      created_at: record.createdAt,
      updated_at: record.updatedAt
    });

    const results = await atmos.search('users', 'search query');
    
    expect(results.length).toBe(1);
    expect(results[0].id).toBe(record.id);
    expect(results[0].record?.data.name).toBe('Test User');

    // 3. Remove
    const deleted = await atmos.remove('users', record.id);
    
    expect(deleted).toBe(true);
    expect(mockConfig.bindings.db.run).toHaveBeenCalledTimes(2); // insert + delete
    expect(mockConfig.bindings.vectorize.deleteByIds).toHaveBeenCalledWith([record.id]);
  });

  it('search throws error if AI binding is missing', async () => {
    const noAiConfig = { ...mockConfig, bindings: { ...mockConfig.bindings, ai: undefined } };
    const atmosNoAi = new Atmos(noAiConfig as any);
    
    await expect(atmosNoAi.search('users', 'query')).rejects.toThrow('AI binding not configured');
  });

  it('remove returns false if record not found in D1', async () => {
    mockConfig.bindings.db.run.mockResolvedValueOnce({ meta: { changes: 0 } });
    
    const result = await atmos.remove('users', 'non-existent');
    expect(result).toBe(false);
  });
});
