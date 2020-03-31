const jwt = require('jsonwebtoken')

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
  console.log(user)
  const { email, id } = user;
  const token = signJwtToken(email);
  return setToken(redisClient, token, id)
    .then(() => {
      return { success: "true", user: user, token };
    })
    .catch(err => Promise.reject("Error while saving token"));
};

const handleRegister = (req, res, db, redisClient, bcrypt) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json('incorrect form submission');
  }
  const hash = bcrypt.hashSync(password);
  db.transaction(trx => {
    trx.insert({
      hash: hash,
      email: email
    })
      .into('login')
      .returning('email')
      .then(loginEmail => {
        return trx('users')
          .returning('*')
          .insert({
            email: loginEmail[0],
            name: name,
            joined: new Date()
          })
          .then(user => {
            createSession(redisClient, user[0])
              .then(data => {
                console.log(data)
                const { user, token } = data
                console.log(user)
                res.json({ user, token })
              })
          })
          .then(trx.commit)
          .catch(trx.rollback)
      })
      .catch(err => res.status(400).json('unable to register'))
  })
}
module.exports = {
  handleRegister: handleRegister
};
