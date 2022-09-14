const passport = require('passport');
const LocalStrategy = require('passport-local');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/user');
const config = require('./keys');

// Setting username field to email rather than username
const localOptions = {
  usernameField: 'email',
  passwordField: 'password',
};

const jwtOptions = {
  // jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.secretOrKey,
};

// Setting up JWT login strategy
const jwtLogin = new JwtStrategy(jwtOptions, (payload, cb) => {
  User.findOne({ email: payload.email }, (err, user) => {
    if (err) {
      return cb(err, false);
    }

    if (user) {
      cb(null, user);
    } else {
      cb(null, false);
    }
  });
});

// passport.use(localLogin);
passport.use(jwtLogin);
