// stravaService.js
// Strava OAuth: token exchange + refresh.

const axios = require('axios');
const FormData = require('form-data');

// These names match exactly what Strava's API settings dashboard calls
// them: "Client ID" and "Client Secret".
const STRAVA_CONFIG = {
  clientId: process.env.STRAVA_CLIENT_ID,
  clientSecret: process.env.STRAVA_CLIENT_SECRET,
  authorizeUrl: 'https://www.strava.com/oauth/authorize',
  accessTokenUrl: 'https://www.strava.com/oauth/token',
  scope: 'activity:read_all,activity:write',
};

/**
 * Exchanges an OAuth authorization code for an access/refresh token pair.
 */
async function exchangeCodeForToken(code) {
  const response = await axios.post(STRAVA_CONFIG.accessTokenUrl, {
    client_id: STRAVA_CONFIG.clientId,
    client_secret: STRAVA_CONFIG.clientSecret,
    code,
    grant_type: 'authorization_code',
  });
  return response.data; // { access_token, refresh_token, expires_at, athlete, ... }
}

/**
 * Refreshes an expired access token. Strava access tokens expire after 6 hours.
 */
async function refreshAccessToken(refreshToken) {
  const response = await axios.post(STRAVA_CONFIG.accessTokenUrl, {
    client_id: STRAVA_CONFIG.clientId,
    client_secret: STRAVA_CONFIG.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  return response.data;
}

/**
 * Uploads an activity file (e.g. .fit) to Strava on behalf of an athlete.
 * Mirrors OAuthSwift's postMultiPartRequest to Strava's uploads endpoint.
 */
async function uploadActivity(accessToken, fileBuffer, name) {
  const form = new FormData();
  form.append('file', fileBuffer, {
    filename: 'activity.fit',
    contentType: 'application/octet-stream',
  });
  form.append('data_type', 'fit');
  form.append('name', name);

  const response = await axios.post('https://www.strava.com/api/v3/uploads', form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
}

module.exports = {
  STRAVA_CONFIG,
  exchangeCodeForToken,
  refreshAccessToken,
  uploadActivity,
};