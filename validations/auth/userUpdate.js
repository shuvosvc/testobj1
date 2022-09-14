const Validator = require('validator');
const isEmpty = require('../is-empty');

const checkCharecters = require('../../helpers/charecterChecker');

module.exports = function validateRegisterInput(data) {
  const errors = {};
  data.email = !isEmpty(data.email) ? data.email : '';
  data.password = !isEmpty(data.password) ? data.password : '';
  data.siteName = !isEmpty(data.siteName) ? data.siteName : '';
  data.name = !isEmpty(data.name) ? data.name : '';

  if (!Validator.isEmpty(data.email)) {
    if (!Validator.isEmail(data.email)) {
      errors.message = 'Email is invalid';
    }
  }
  if (!Validator.isEmpty(data.siteName)) {
    if (!Validator.isLength(data.siteName, { min: 1, max: 30 })) {
      errors.message = 'siteName is required!';
    } else {
      if (checkCharecters.charecterChecker(data.siteName) === false) {
        errors.message = 'No special charecters are allowed in site name!';
      }
    }
  }

  if (
    !Validator.isEmpty(data.siteName) &&
    checkCharecters.charecterChecker(data.siteName) === false
  ) {
    errors.message = 'No special charecters are allowed in site name!';
  }

  if (!Validator.isEmpty(data.name)) {
    if (!Validator.isLength(data.name, { min: 1, max: 30 })) {
      errors.message = 'Name must be of 1 to 30 charecter!';
    }
  }
  if (!Validator.isEmpty(data.password)) {
    if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
      errors.message = 'Password must be of 6 to 30 charecter!';
    }
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
