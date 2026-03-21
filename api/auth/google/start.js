import { OAuth2Client } from 'google-auth-library';

const PRODUCTION_SUPABASE_URL = 'https://erycithhilhzbgzrccka.supabase.co';
const CANONICAL_WEB_ORIGIN = 'https://payonar.com';

function shouldUseCanonicalOrigin(host) {
  if (!host || host === 'payonar.com' || host === 'www.payonar.com') {
    return false;
  }

  return host.endsWith('.vercel.app');
}

function getOrigin(req) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (typeof host === 'string' && shouldUseCanonicalOrigin(host.split(',')[0].trim())) {
    return CANONICAL_WEB_ORIGIN;
  }

  const protocol = typeof forwardedProto === 'string' ? forwardedProto.split(',')[0] : 'https';
  return `${protocol}://${host}`;
}

function getSupabaseUrl() {
  return process.env.VITE_SUPABASE_URL || PRODUCTION_SUPABASE_URL;
}

function getLandingRedirect(req) {
  return `${getOrigin(req)}/landing`;
}

function createClient(req) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
  const redirectUri = `${getOrigin(req)}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return null;
  }

  return new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri,
  });
}

function buildSupabaseAuthorizeUrl(req) {
  const authorizeUrl = new URL('/auth/v1/authorize', getSupabaseUrl());
  authorizeUrl.searchParams.set('provider', 'google');
  authorizeUrl.searchParams.set('redirect_to', getLandingRedirect(req));
  authorizeUrl.searchParams.set('prompt', 'select_account');
  return authorizeUrl.toString();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const client = createClient(req);
    if (!client) {
      res.redirect(buildSupabaseAuthorizeUrl(req));
      return;
    }

    const authUrl = client.generateAuthUrl({
      access_type: 'online',
      prompt: 'select_account',
      scope: ['openid', 'email', 'profile'],
      include_granted_scopes: true,
    });

    res.redirect(authUrl);
  } catch (error) {
    const origin = getOrigin(req);
    const message = error instanceof Error ? error.message : 'Google girisi baslatilamadi.';
    res.redirect(`${origin}/landing?google_error=${encodeURIComponent(message)}`);
  }
}