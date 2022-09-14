const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateRegisterInput(data) {
  const errors = {};

  data.otp = !isEmpty(data.otp.toString()) ? data.otp.toString() : '';
  data.email = !isEmpty(data.email) ? data.email : '';

  if (Validator.isEmpty(data.email)) {
    errors.message = 'Email field is required';
  }

  if (!Validator.isEmail(data.email)) {
    errors.message = 'Email is invalid';
  }

  if (Validator.isEmpty(data.otp)) {
    errors.message = 'Otp field is required';
  }

  if (
    !Validator.isEmpty(data.otp) &&
    !Validator.isLength(data.otp, { min: 5, max: 5 })
  ) {
    errors.message = 'Otp must be at least 5 characters';
  }
  if (!Validator.isNumeric(data.otp)) {
    errors.message = 'Otp must be numeric value only!';
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
