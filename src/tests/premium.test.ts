import { describe, expect, it } from 'vitest';
import { getSubscriptionPlanFromSupabaseUser, parsePremiumList, resolveSubscriptionPlan } from '../utils/premium';

describe('premium helpers', () => {
  it('parses comma separated premium identifiers', () => {
    expect(parsePremiumList(' a@example.com, b@example.com , a@example.com ')).toEqual([
      'a@example.com',
      'b@example.com',
    ]);
  });

  it('resolves premium plan from explicit subscription plan', () => {
    expect(resolveSubscriptionPlan({ subscriptionPlan: 'premium' })).toBe('premium');
  });

  it('reads premium plan from Supabase user metadata', () => {
    expect(
      getSubscriptionPlanFromSupabaseUser({
        app_metadata: { subscription_plan: 'premium' },
        user_metadata: {},
      } as never),
    ).toBe('premium');
  });

  it('resolves premium plan from whitelisted email', () => {
    expect(
      resolveSubscriptionPlan(
        { email: 'VIP@Example.com' },
        { allowOverrides: true, premiumEmails: ['vip@example.com'] },
      ),
    ).toBe('premium');
  });

  it('resolves premium plan from whitelisted google id', () => {
    expect(
      resolveSubscriptionPlan(
        { googleId: 'google-123' },
        { allowOverrides: true, premiumGoogleIds: ['google-123'] },
      ),
    ).toBe('premium');
  });

  it('ignores premium override lists unless debug override mode is enabled', () => {
    expect(
      resolveSubscriptionPlan(
        { email: 'vip@example.com', googleId: 'google-123' },
        { premiumEmails: ['vip@example.com'], premiumGoogleIds: ['google-123'] },
      ),
    ).toBe('free');
  });

  it('falls back to free plan when account is not in any premium list', () => {
    expect(
      resolveSubscriptionPlan(
        { email: 'free@example.com', googleId: 'g-999' },
        { allowOverrides: true, premiumEmails: ['vip@example.com'], premiumGoogleIds: ['g-111'] },
      ),
    ).toBe('free');
  });

  it('forces known premium test accounts to premium', () => {
    expect(resolveSubscriptionPlan({ email: 'onurkantakil@gmail.com' }, { allowOverrides: false })).toBe('premium');
  });

  it('forces known basic test accounts to free', () => {
    expect(resolveSubscriptionPlan({ email: 'onbukasubs@gmail.com', subscriptionPlan: 'premium' }, { allowOverrides: false })).toBe('free');
  });
});