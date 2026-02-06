import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentUserId } from './identity';

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn((name: string) => {
      if (name === 'pool_anonymous_id') return { value: 'test_anon_123' };
      return null;
    }),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

describe('Identity Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get current user ID and anonymous ID', () => {
    const result = getCurrentUserId();
    expect(result.anonymousId).toBe('test_anon_123');
    expect(result.userId).toBeNull();
  });
});
