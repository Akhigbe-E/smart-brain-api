const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const knex = require("knex");
const redis = require("redis");
const morgan = require("morgan");

const register = require("./controllers/register");
const signin = require("./controllers/signin");
const profile = require("./controllers/profile");
const image = require("./controllers/image");
const auth = require("./middleware/authorization");

const db = knex({
  client: "pg",
  connection: process.env.POSTGRES_URI
});

const redisClient = redis.createClient(process.env.REDIS_URI);


const app = express();

app.use(morgan("combined"));
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send(db.users);
});
app.post("/signin", signin.handleSigninAuthentication(db, redisClient, bcrypt));
app.post("/register", (req, res) => {
  register.handleRegister(req, res, db, redisClient, bcrypt);
});
app.get("/profile/:id", auth.requireAuth(redisClient), (req, res) => {
  profile.handleProfileGet(req, res, db);
});
app.post("/profile/:id", auth.requireAuth(redisClient), (req, res) => {
  profile.handleProfileUpdate(req, res, db);
});
app.put("/image", auth.requireAuth(redisClient), (req, res) => {
  image.handleImage(req, res, db);
});
app.post("/imageurl", auth.requireAuth(redisClient), (req, res) => {
  image.handleApiCall(req, res);
});

app.listen(3001, () => {
  console.log("app is running on port 3001");
});
