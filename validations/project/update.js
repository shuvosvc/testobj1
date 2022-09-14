const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateRegisterInput(data) {
  const errors = {};

  data.name = !isEmpty(data.name) ? data.name : '';
  data.description = !isEmpty(data.description) ? data.description : '';

  if (!Validator.isEmpty(data.name)) {
    if (!Validator.isLength(data.name, { min: 1 })) {
      errors.message = 'name is required!';
    }
  }

  if (!Validator.isEmpty(data.description) && data.description.length > 240) {
    errors.message = 'Maximum 240 characters allowed in description field!';
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
