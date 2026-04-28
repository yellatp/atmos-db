import { describe, it, expect, vi } from 'vitest';
import { Atmos } from '../src/index';

const mockConfig = {
  bindings: {
    db: {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
      first: vi.fn().mockResolvedValue({ id: '1', data: '{}' }),
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

describe('Atmos Integration', () => {
  it('calls embedder, db.insert, and vector.upsert on set', async () => {
    const atmos = new Atmos(mockConfig);
    
    // Spies - we already mocked the CF dependencies, so let's just make sure they get called
    const dbInsertSpy = vi.spyOn(atmos.db, 'insert');
    const embedSpy = vi.spyOn(atmos.embedder!, 'embed');
    const vectorUpsertSpy = vi.spyOn(atmos.vector, 'upsert');

    await atmos.set('users', { bio: 'A test user string for AI.' });

    expect(dbInsertSpy).toHaveBeenCalled();
    expect(embedSpy).toHaveBeenCalledWith('A test user string for AI.');
    expect(vectorUpsertSpy).toHaveBeenCalled();
  });
});
