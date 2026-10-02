require("dotenv").config();
const Express = require("express");
const app = Express();
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");


const { stravacontroller, komootcontroller } = require('./controllers')
const { validate, cors } = require("./middleware");

app.use(Express.json());
app.use(cors);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Omata Activity Sync Proxy API",
      description:
        "Proxy server that handles the Strava and Komoot OAuth handshakes and activity uploads on behalf of the Omata iOS app, so the app never has to hold either provider's client secret.",
      contact: {
        name: "Corynne Moody",
      },
    },
    servers: [
      {
        url: "http://localhost:8888",
      },
      {
        url: "https://server-project-silk.vercel.app",
      },
    ],
    components: {
      securitySchemes: {
        StravaOAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "Strava access token",
          description:
            "Strava access token returned to the app via /strava/callback.",
        },
        KomootOAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "Komoot access token",
          description:
            "Komoot access token returned to the app via /komoot/callback.",
        },
      },
    },
  },
  apis: ["*.js", "./controllers/*.js", "./models/*.js"],
};

const specs = swaggerJsdoc(options);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    // explorer: true
  })
);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Redirects to the Swagger API docs.
 *     tags: [Tests]
 *     responses:
 *       302:
 *         description: "Redirects to /api-docs"
 */
app.get('/', (req, res) => {
  res.redirect('/api-docs')
})

app.use("/static", Express.static("node_modules"));

/**
 * @swagger
 * /test:
 *   get:
 *     summary: returns a successful request if hit
 *     tags: [Tests]
 *     responses:
 *       200:
 *         description: returns "test endpoint successful!"
 */
app.get("/test", (req, res) => {
  res.json({
    message: "test endpoint successful!",
  });
});


app.use('/strava', stravacontroller)
app.use('/komoot', komootcontroller)



app.listen(process.env.PORT, () => {
  console.info(`[omata-proxy]: app listening on ${process.env.PORT}`);
})


module.exports = app;
