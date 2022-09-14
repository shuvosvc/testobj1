const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateLoginInput(data) {
  const errors = {};

  data.email = !isEmpty(data.email) ? data.email : '';
  data.password = !isEmpty(data.password) ? data.password : '';

  if (!Validator.isEmail(data.email)) {
    errors.message = 'Email is invalid';
  }

  if (Validator.isEmpty(data.email)) {
    errors.message = 'Email field is required';
  }

  if (Validator.isEmpty(data.password)) {
    errors.message = 'Password field is required';
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
