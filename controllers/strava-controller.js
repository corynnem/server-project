const { Router } = require('express');
const multer = require('multer');


let stravacontroller
 = Router();

 const upload = multer();

 const { stravaService } = require('../services');
 const { exchangeCodeForToken, uploadActivity } = stravaService;

 /**
  * @swagger
  * /strava/authorize:
  *   get:
  *     summary: Kicks off Strava OAuth. The iOS app opens this URL in an
  *              ASWebAuthenticationSession — it never sees client_id or
  *              Strava's authorize URL directly.
  *     tags: [Strava]
  *     responses:
  *       302:
  *         description: "Redirects to Strava's login/consent screen"
  */
 stravacontroller.get('/authorize', (req, res) => {

   const params = new URLSearchParams({
     client_id: process.env.STRAVA_CLIENT_ID,
     redirect_uri: `${process.env.SERVER_BASE_URL}/strava/callback`,
     response_type: 'code',
     approval_prompt: 'auto',
     scope: 'activity:read_all,activity:write',
   });
 
   res.redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`);
 });
 
 /**
  * @swagger
  * /strava/callback:
  *   get:
  *     summary: Strava redirects here after user login/consent with ?code=...
  *              Server exchanges the code for a token, then redirects back
  *              into the app via its custom URL scheme.
  *     tags: [Strava]
  *     responses:
  *       302:
  *         description: "Redirects to omataapp://com.omata.app/strava with token or error"
  */
 stravacontroller.get('/callback', async (req, res) => {
   const { code, error } = req.query;
   const appRedirect = 'omataapp://com.omata.app/strava';
 
   if (error || !code) {
     return res.redirect(`${appRedirect}?error=${encodeURIComponent(error || 'missing_code')}`);
   }
 
   try {
     const tokenData = await exchangeCodeForToken(code);
     res.redirect(`${appRedirect}?token=${encodeURIComponent(tokenData.access_token)}`);
   } catch (err) {
     console.error('Strava callback failed:', err.response?.data || err.message);
     res.redirect(`${appRedirect}?error=server_error`);
   }
 });


/**
 * @swagger
 * /strava/upload:
 *   post:
 *     summary: Uploads an Omata activity (.fit file) to Strava on behalf of
 *              the logged-in athlete. Requires the athlete's Strava access
 *              token (from /strava/callback) as a Bearer token.
 *     tags: [Strava]
 *     security:
 *       - Strava OAuth: []
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
 *         description: 'failed to upload activity to Strava'
 */


stravacontroller.post('/upload', upload.single('file'), async (req, res) => {
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
    console.error('Strava upload failed:', e.response?.data || e.message);
    res.status(500).json({
      message: "Failed to upload ride to Strava",
    });
  }
})




module.exports = stravacontroller
