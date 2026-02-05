import { describe, it, expect, vi, beforeEach, afterEach } from 'jest';

describe('Discovery Service', () => {
  describe('determineStatus', () => {
    it('should return active for recently updated sessions', () => {
      const now = Date.now();
      const status = determineStatus(now);
      expect(status).toBe('active');
    });

    it('should return inactive for old sessions', () => {
      const oldTime = Date.now() - 2 * 60 * 60 * 1000;
      const status = determineStatus(oldTime);
      expect(status).toBe('inactive');
    });
  });
});

function determineStatus(lastUpdated: number): 'active' | 'inactive' {
  const sixtyMinutesAgo = Date.now() - 60 * 60 * 1000;
  return lastUpdated > sixtyMinutesAgo ? 'active' : 'inactive';
}

describe('Status Determination', () => {
  it('should be active within 60 minutes', () => {
    const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
    expect(determineStatus(thirtyMinAgo)).toBe('active');
  });

  it('should be inactive after 60 minutes', () => {
    const ninetyMinAgo = Date.now() - 90 * 60 * 1000;
    expect(determineStatus(ninetyMinAgo)).toBe('inactive');
  });
});
