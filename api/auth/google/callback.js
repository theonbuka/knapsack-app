import { OAuth2Client } from 'google-auth-library';

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

function createClient(req) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
  const redirectUri = `${getOrigin(req)}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth server ayarlari eksik. GOOGLE_OAUTH_CLIENT_ID ve GOOGLE_OAUTH_CLIENT_SECRET tanimlanmali.');
  }

  return {
    clientId,
    oauthClient: new OAuth2Client({
      clientId,
      clientSecret,
      redirectUri,
    }),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const origin = getOrigin(req);
  const code = typeof req.query.code === 'string' ? req.query.code : '';

  if (!code) {
    res.redirect(`${origin}/landing?google_error=${encodeURIComponent('Google callback code parametresi eksik.')}`);
    return;
  }

  try {
    const { clientId, oauthClient } = createClient(req);
    const { tokens } = await oauthClient.getToken(code);

    if (!tokens.id_token) {
      throw new Error('Google id_token donmedi.');
    }

    await oauthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });

    res.redirect(`${origin}/landing#google_id_token=${encodeURIComponent(tokens.id_token)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google callback islemi basarisiz oldu.';
    res.redirect(`${origin}/landing?google_error=${encodeURIComponent(message)}`);
  }
}