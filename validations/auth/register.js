const Validator = require('validator');
const isEmpty = require('../is-empty');

const checkCharecters = require('../../helpers/charecterChecker');

module.exports = function validateRegisterInput(data) {
  const errors = {};

  data.email = !isEmpty(data.email) ? data.email : '';
  data.siteName = !isEmpty(data.siteName) ? data.siteName : '';

  data.password = !isEmpty(data.password) ? data.password : '';
  data.name = !isEmpty(data.name) ? data.name : '';

  if (!Validator.isEmail(data.email)) {
    errors.message = 'Email is invalid';
  }
  if (Validator.isEmpty(data.siteName)) {
    errors.message = 'siteName field is required';
  }
  if (Validator.isEmpty(data.name)) {
    errors.message = 'name field is required';
  }
  if (
    !Validator.isEmpty(data.name) &&
    !Validator.isLength(data.name, { min: 1, max: 30 })
  ) {
    errors.message = 'Name must be of 1 to 30 charecter!';
  }

  if (
    !Validator.isEmpty(data.siteName) &&
    checkCharecters.charecterChecker(data.siteName) === false
  ) {
    errors.message = 'No special charecters are allowed in site name!';
  }

  if (Validator.isEmpty(data.email)) {
    errors.message = 'email field is required';
  }

  if (Validator.isEmpty(data.password)) {
    errors.message = 'Password field is required';
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
