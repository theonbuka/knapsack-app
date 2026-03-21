import { describe, expect, it } from 'vitest';
import {
  getNativeAuthRedirectUrl,
  isNativeAuthCallbackUrl,
  readAuthCallbackParams,
  resolveSupabaseAuthRedirectUrl,
} from '../utils/supabaseAuth';

describe('resolveSupabaseAuthRedirectUrl', () => {
  it('always uses the active origin on web even when an env override exists', () => {
    expect(
      resolveSupabaseAuthRedirectUrl(
        '/landing',
        'http://127.0.0.1:5177',
        'http://localhost:5177/landing',
      ),
    ).toBe('http://127.0.0.1:5177/landing');
  });

  it('uses the whitelisted production redirect in deployed web environments', () => {
    expect(
      resolveSupabaseAuthRedirectUrl(
        '/landing',
        'https://knapsack.example',
        'http://localhost:5177/landing',
      ),
    ).toBe('https://payonar.com/landing');
  });

  it('uses the in-app web origin when hosted on localhost without a port', () => {
    expect(
      resolveSupabaseAuthRedirectUrl(
        '/landing',
        'http://localhost',
        'http://localhost:5177/landing',
      ),
    ).toBe('http://localhost/landing');
  });

  it('uses the whitelisted production redirect when no override exists', () => {
    expect(resolveSupabaseAuthRedirectUrl('/landing', 'https://knapsack.example', '')).toBe(
      'https://payonar.com/landing',
    );
  });

  it('uses the whitelisted production redirect when current origin is unavailable', () => {
    expect(resolveSupabaseAuthRedirectUrl('/landing', '', 'https://knapsack.example/landing')).toBe(
      'https://payonar.com/landing',
    );
  });

  it('uses the native callback URL on native platforms', () => {
    expect(resolveSupabaseAuthRedirectUrl('/landing', 'https://knapsack.example', '', true)).toBe(
      getNativeAuthRedirectUrl(),
    );
  });
});

describe('native auth callback helpers', () => {
  it('matches the configured native callback URL', () => {
    expect(isNativeAuthCallbackUrl(getNativeAuthRedirectUrl())).toBe(true);
  });

  it('rejects other custom-scheme URLs', () => {
    expect(isNativeAuthCallbackUrl('com.theonbuka.knapsack://auth/other')).toBe(false);
  });

  it('merges query and fragment parameters from callback URLs', () => {
    const params = readAuthCallbackParams(
      `${getNativeAuthRedirectUrl()}?state=abc#access_token=token123&refresh_token=refresh456`,
    );

    expect(params.get('state')).toBe('abc');
    expect(params.get('access_token')).toBe('token123');
    expect(params.get('refresh_token')).toBe('refresh456');
  });
});