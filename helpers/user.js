const User = require('../models/user');

exports.setUserInfo = function setUserInfo(request) {
  const getUserInfo = {
    name: request.name,
    lastname: request.lastname,
    email: request.email,
    id: request._id,
  };

  return getUserInfo;
};
