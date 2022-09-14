const Validator = require('validator');
const isEmpty = require('../is-empty');

const checkCharecters = require('../../helpers/charecterChecker');

module.exports = function validateRegisterInput(data) {
  const errors = {};

  data.name = !isEmpty(data.name) ? data.name : '';
  data.description = !isEmpty(data.description) ? data.description : '';
  data.url = !isEmpty(data.url) ? data.url : '';

  data.invitedMembers = !isEmpty(data.invitedMembers)
    ? data.invitedMembers
    : [];

  if (Validator.isEmpty(data.name)) {
    errors.message = 'Name field is required';
  }

  if (Validator.isEmpty(data.url)) {
    errors.message = 'Url field is required';
  }
  if (Validator.isEmpty(data.description)) {
    errors.message = 'Description field is required';
  }

  if (!Validator.isEmpty(data.description) && data.description.length > 240) {
    errors.message = 'Maximum 240 characters allowed in description field!';
  }

  if (
    !Validator.isEmpty(data.url) &&
    checkCharecters.charecterChecker(data.url) === false
  ) {
    errors.message = 'No special charecters are allowed in team url !';
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
