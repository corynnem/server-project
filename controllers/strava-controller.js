const { Router } = require('express');


let stravacontroller
 = Router();

 const { exchangeCodeForToken } = require('../services');

 /**
  * @swagger
  * /strava/authorize:
  *   get:
  *     summary: Kicks off Strava OAuth. The iOS app opens this URL in an
  *              ASWebAuthenticationSession — it never sees client_id or
  *              Strava's authorize URL directly.
  *     tags: [Task]
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
  *     tags: [Task]
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
 *     summary: Omata user who is logged into Strava can upload their Omata rides to Strava
 *     tags: [Task]
 *     security: 
 *       - Strava OAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       200:
 *         description: "updated successfully" 
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       409:
 *         description: 'required fields missing, Task not found, or Task is unauthorized to edit'
 *       500:
 *         description: 'failed to update Task'
 */


stravacontroller.post('/upload', async (req, res) => {
  const { _vars } = req.body;

  try {
    // Strava upload

  } catch (e) {
    res.status(500).json({
      message: "Failed to upload ride to Strava",
    });
  }
})




module.exports = stravacontroller
