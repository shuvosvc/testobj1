const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateRegisterInput(data) {
  const errors = {};

  data.cardNumber = !isEmpty(data.cardNumber) ? data.cardNumber : '';

  data.cardCvc = !isEmpty(data.cardCvc) ? data.cardCvc : '';

  if (Validator.isEmpty(data.cardNumber)) {
    errors.message = 'cardNumber field is required';
  }

  if (Validator.isEmpty(data.cardCvc)) {
    errors.message = 'cardCvc field is required';
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
