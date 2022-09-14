const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateRegisterInput(data) {
  const errors = {};

  data.password = !isEmpty(data.password) ? data.password : '';

  if (Validator.isEmpty(data.password)) {
    errors.message = 'password field is required';
  } else {
    if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
      errors.message = 'Password must be at least 6 characters';
    }
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
