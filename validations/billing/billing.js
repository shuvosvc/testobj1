const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateRegisterInput(data) {
  const errors = {};

  data.sourceToken = !isEmpty(data.sourceToken) ? data.sourceToken : '';

  data.cardName = !isEmpty(data.cardName) ? data.cardName : '';

  data.country = !isEmpty(data.country) ? data.country : '';
  data.address = !isEmpty(data.address) ? data.address : '';
  data.extraAddress = !isEmpty(data.extraAddress) ? data.extraAddress : '';
  data.city = !isEmpty(data.city) ? data.city : '';
  data.state = !isEmpty(data.state) ? data.state : '';

  if (Validator.isEmpty(data.sourceToken)) {
    errors.message = 'Invalid card information';
  }

  if (Validator.isEmpty(data.cardName)) {
    errors.message = 'cardName field is required';
  }
  if (Validator.isEmpty(data.country)) {
    errors.message = 'country field is required';
  }
  if (Validator.isEmpty(data.address)) {
    errors.message = 'address field is required';
  }
  if (Validator.isEmpty(data.city)) {
    errors.message = 'city field is required';
  }
  if (Validator.isEmpty(data.state)) {
    errors.message = 'state field is required';
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
