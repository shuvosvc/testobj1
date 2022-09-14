const jwt = require('jsonwebtoken');
const config = require('../config/keys');

exports.generateToken = function (user) {
  return jwt.sign(
    {
      id: user._id,
      image: user.image,
      name: user.name,
      email: user.email,
      siteName: user.siteName,
      activeStatus: user.activeStatus,
      trialSeason: user.trialSeason,
      membership: user.membership,
      role: user.role,
      billing: user.billing,
    },
    config.secretOrKey,
    { expiresIn: '24h' }
  );
};
