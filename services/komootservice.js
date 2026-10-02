// komootservice.js
// Komoot OAuth: token exchange + activity upload.

const axios = require('axios');

// These names match exactly what Komoot's API settings dashboard calls
// them: "consumerKey" and "consumerSecret" (i.e. client_id / client_secret).
const KOMOOT_CONFIG = {
  clientId: process.env.KOMOOT_CONSUMER_KEY,
  clientSecret: process.env.KOMOOT_CONSUMER_SECRET,
  authorizeUrl: 'https://auth.komoot.de/oauth/authorize',
  accessTokenUrl: 'https://auth.komoot.de/oauth/token',
  uploadUrl: 'https://external-api.komoot.de/v007/tours/',
  scope: 'profile,tour-upload',
};

/**
 * Exchanges an OAuth authorization code for an access token.
 */
async function exchangeCodeForToken(code, redirectUri) {
  const response = await axios.post(KOMOOT_CONFIG.accessTokenUrl, {
    client_id: KOMOOT_CONFIG.clientId,
    client_secret: KOMOOT_CONFIG.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });
  return response.data;
}

/**
 * Uploads an activity file (e.g. .fit) to Komoot as a tour, on behalf of a user.
 * Komoot's upload takes the raw file as the request body (not multipart),
 * with data_type/name passed as query params.
 */
async function uploadActivity(accessToken, fileBuffer, name) {
  const response = await axios.post(KOMOOT_CONFIG.uploadUrl, fileBuffer, {
    params: {
      data_type: 'fit',
      name,
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'com.omata/0.8.3',
      'Content-Type': 'application/octet-stream',
    },
  });
  return response.data;
}

module.exports = {
  KOMOOT_CONFIG,
  exchangeCodeForToken,
  uploadActivity,
};
