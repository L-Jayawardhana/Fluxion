import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for subscriptionService module.
 */

vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

import api from '../../src/services/api';
import { getPlan, updatePlan } from '../../src/services/subscriptionService';

describe('subscriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPlan should call GET /Organization/:id/plan', async () => {
    api.get.mockResolvedValue({ data: { planName: 'Pro' } });
    const result = await getPlan(5);
    expect(api.get).toHaveBeenCalledWith('/Organization/5/plan');
    expect(result).toEqual({ planName: 'Pro' });
  });

  it('updatePlan should call PUT /Organization/:id/plan with planName', async () => {
    api.put.mockResolvedValue({ data: { message: 'Plan updated' } });
    const result = await updatePlan(5, 'Enterprise');
    expect(api.put).toHaveBeenCalledWith('/Organization/5/plan', { planName: 'Enterprise' });
    expect(result).toEqual({ message: 'Plan updated' });
  });
});
