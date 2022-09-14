const Validator = require('validator');
const isEmpty = require('../is-empty');

const checkCharecters = require('../../helpers/charecterChecker');

module.exports = function validateRegisterInput(data) {
  const errors = {};
  data.name = !isEmpty(data.name) ? data.name : '';
  data.url = !isEmpty(data.url) ? data.url : '';
  data.description = !isEmpty(data.description) ? data.description : '';

  if (!Validator.isEmpty(data.url)) {
    if (!Validator.isLength(data.url, { min: 1, max: 30 })) {
      errors.message = 'Url is required!';
    } else {
      if (checkCharecters.charecterChecker(data.url) === false) {
        errors.message = 'No special charecters are allowed in team url!';
      }
    }
  }

  if (!Validator.isEmpty(data.description) && data.description.length > 240) {
    errors.message = 'Maximum 240 characters allowed in description field!';
  }

  if (!Validator.isEmpty(data.name)) {
    if (!Validator.isLength(data.name, { min: 1 })) {
      errors.message = 'name is required!';
    }
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
