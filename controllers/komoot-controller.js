const { Router } = require('express');
const multer = require('multer');

let komootcontroller = Router();

const upload = multer();

const { komootService } = require('../services');
const { exchangeCodeForToken, uploadActivity } = komootService;

/**
 * @swagger
 * /komoot/authorize:
 *   get:
 *     summary: Kicks off Komoot OAuth. The iOS app opens this URL in an
 *              ASWebAuthenticationSession — it never sees client_id or
 *              Komoot's authorize URL directly.
 *     tags: [Komoot]
 *     responses:
 *       302:
 *         description: "Redirects to Komoot's login/consent screen"
 */
komootcontroller.get('/authorize', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.KOMOOT_CONSUMER_KEY,
    redirect_uri: `${process.env.SERVER_BASE_URL}/komoot/callback`,
    response_type: 'code',
    scope: 'profile,tour-upload',
  });

  res.redirect(`https://auth.komoot.de/oauth/authorize?${params.toString()}`);
});

/**
 * @swagger
 * /komoot/callback:
 *   get:
 *     summary: Komoot redirects here after user login/consent with ?code=...
 *              Server exchanges the code for a token, then redirects back
 *              into the app via its custom URL scheme.
 *     tags: [Komoot]
 *     responses:
 *       302:
 *         description: "Redirects to omataapp://com.omata.app/komoot with token or error"
 */
komootcontroller.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  const appRedirect = 'omataapp://com.omata.app/komoot';

  if (error || !code) {
    return res.redirect(`${appRedirect}?error=${encodeURIComponent(error || 'missing_code')}`);
  }

  try {
    const redirectUri = `${process.env.SERVER_BASE_URL}/komoot/callback`;
    const tokenData = await exchangeCodeForToken(code, redirectUri);
    res.redirect(`${appRedirect}?token=${encodeURIComponent(tokenData.access_token)}`);
  } catch (err) {
    console.error('Komoot callback failed:', err.response?.data || err.message);
    res.redirect(`${appRedirect}?error=server_error`);
  }
});

/**
 * @swagger
 * /komoot/upload:
 *   post:
 *     summary: Uploads an Omata activity (.fit file) to Komoot as a tour, on
 *              behalf of the logged-in user. Requires the user's Komoot
 *              access token (from /komoot/callback) as a Bearer token.
 *     tags: [Komoot]
 *     security:
 *       - KomootOAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: "uploaded successfully"
 *       409:
 *         description: 'required fields missing (file, name, or Authorization header)'
 *       500:
 *         description: 'failed to upload activity to Komoot'
 */
komootcontroller.post('/upload', upload.single('file'), async (req, res) => {
  const { name } = req.body || {};
  const accessToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!req.file || !name || !accessToken) {
    return res.status(409).json({
      message: "required fields missing",
    });
  }

  try {
    const activity = await uploadActivity(accessToken, req.file.buffer, name);
    res.json(activity);
  } catch (e) {
    console.error('Komoot upload failed:', e.response?.data || e.message);
    res.status(500).json({
      message: "Failed to upload ride to Komoot",
    });
  }
});

module.exports = komootcontroller
