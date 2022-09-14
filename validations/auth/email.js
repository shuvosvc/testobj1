const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateRegisterInput(data) {
  const errors = {};

  data.email = !isEmpty(data.email) ? data.email : '';

  if (!Validator.isEmail(data.email)) {
    errors.message = 'Email is invalid';
  }
  if (Validator.isEmpty(data.email)) {
    errors.message = 'email field is required';
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
