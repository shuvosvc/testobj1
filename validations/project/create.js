const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateRegisterInput(data) {
  const errors = {};

  data.name = !isEmpty(data.name) ? data.name : '';
  data.description = !isEmpty(data.description) ? data.description : '';
  data.teamUrl = !isEmpty(data.teamUrl) ? data.teamUrl : '';

  if (Validator.isEmpty(data.name)) {
    errors.message = 'Name field is required';
  }

  if (Validator.isEmpty(data.description)) {
    errors.message = 'Description field is required';
  }

  if (!Validator.isEmpty(data.description) && data.description.length > 240) {
    errors.message = 'Maximum 240 characters allowed in description field!';
  }

  if (Validator.isEmpty(data.teamUrl)) {
    errors.message = 'teamUrl field is required';
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
