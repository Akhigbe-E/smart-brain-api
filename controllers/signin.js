var jwt = require("jsonwebtoken");


const handleSignin = (db, bcrypt, req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return Promise.reject("Invalid form input");
  }
  return db
    .select("email", "hash")
    .from("login")
    .where("email", "=", email)
    .then(data => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db
          .select("*")
          .from("users")
          .where("email", "=", email)
          .then(user => {
            return Promise.resolve(user[0]);
          })
          .catch(err => Promise.reject("unable to find user"));
      } else {
        Promise.reject("wrong credentials");
      }
    })
    .catch(err => Promise.reject("no user found"));
};

const getAuthTokenId = (redisClient, req, res) => {
  const { authorization } = req.headers;
  return redisClient.get(authorization, (err, reply) => {
    if (err || !reply) {
      return res.status(400).json("Error while getting token")
    } else {
      return res.json({ id: reply })
    }
  });
};

const signJwtToken = email => {
  const jwtPayload = { email };
  return jwt.sign(jwtPayload, `${process.env.REACT_APP_JWT_SECRET}`, {
    expiresIn: "2 days"
  });
};

const setToken = (redisClient, key, value) => {
  return Promise.resolve(redisClient.set(key, value));
};

const createSession = (redisClient, user) => {
  const { email, id } = user;
  const token = signJwtToken(email);
  return setToken(redisClient, token, id)
    .then(() => {
      return { success: "true", userId: id, token };
    })
    .catch(err => Promise.reject("Error while saving token"));
};

const handleSigninAuthentication = (db, redisClient, bcrypt) => (req, res) => {
  const { authorization } = req.headers;
  return authorization
    ? getAuthTokenId(redisClient, req, res)
    : handleSignin(db, bcrypt, req, res)
      .then(data => {
        return data.id && data.email
          ? createSession(redisClient, data)
          : Promise.reject("No email or id");
      })
      .then(session => {
        return res.json(session)
      })
      .catch(err => res.status(400).json(err));
};

module.exports = {
  handleSigninAuthentication: handleSigninAuthentication
};
