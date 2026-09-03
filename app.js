require("dotenv").config();
const Express = require("express");
const app = Express();
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// const { user } = require("./controllers")
const { stravacontroller} = require('./controllers')
const { validate, cors } = require("./middleware");

app.use(Express.json());
app.use(cors);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Project and Task API",
      description:
        "This is an API designed for employers to assign teams, projects, tasks and give feedback to their employees. Application has 2 levels of authentication, Employers must be created first, and they can create Employee accounts and assign them to projects and tasks.",
      contact: {
        name: "Corynne Moody",
      },
    },
    servers: [
      {
        url: "http://localhost:8888",
      },
      {
        url: "https://server-project-z99g.onrender.com/",
      },
    ]
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



app.use('strava', stravacontroller)

app.use("/static", Express.static("node_modules"));




app.listen(process.env.PORT, () => {
  console.info(`[omata-proxy]: app listening on ${process.env.PORT}`);
})


module.exports = app;
