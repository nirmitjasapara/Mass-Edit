const express = require("express");
const path = require("path");
const AuthService = require("./auth-service");

const authRouter = express.Router();
const jsonBodyParser = express.json();

authRouter
  .post("/login", jsonBodyParser, (req, res, next) => {
    const { user_name, password } = req.body;
    const loginUser = { user_name, password };

    for (const [key, value] of Object.entries(loginUser))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        });

    AuthService.getUserWithUserName(req.app.get("db"), loginUser.user_name)
      .then(dbUser => {
        if (!dbUser)
          return res.status(400).json({
            error: "Incorrect User Name or password"
          });

        return AuthService.comparePasswords(
          loginUser.password,
          dbUser.password
        ).then(compareMatch => {
          if (!compareMatch)
            return res.status(400).json({
              error: "Incorrect User Name or password"
            });

          const sub = dbUser.user_name;
          const payload = { user_id: dbUser.id };
          res.send({
            authToken: AuthService.createJwt(sub, payload)
          });
        });
      })
      .catch(next);
  })
  .post("/register", jsonBodyParser, (req, res, next) => {
    const { password, user_name, full_name } = req.body;

    for (const field of ["full_name", "user_name", "password"])
      if (!req.body[field])
        return res.status(400).json({
          error: `Missing '${field}' in request body`
        });

    const passwordError = AuthService.validatePassword(password);

    if (passwordError) return res.status(400).json({ error: passwordError });

    AuthService.hasUserWithUserName(req.app.get("db"), user_name)
      .then(hasUserWithUserName => {
        if (hasUserWithUserName)
          return res.status(400).json({ error: `Username already taken` });

        return AuthService.hashPassword(password).then(hashedPassword => {
          const newUser = {
            user_name,
            password: hashedPassword,
            full_name,
            date_created: "now()"
          };

          return AuthService.insertUser(req.app.get("db"), newUser).then(
            user => {
              res
                .status(201)
                .location(path.posix.join(req.originalUrl, `/${user.id}`))
                .json(AuthService.serializeUser(user));
            }
          );
        });
      })
      .catch(next);
  });

module.exports = authRouter;
