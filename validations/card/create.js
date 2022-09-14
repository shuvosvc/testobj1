const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateRegisterInput(data) {
  const errors = {};

  data.type = !isEmpty(data.type) ? data.type : '';

  data.name = !isEmpty(data.name) ? data.name : '';
  data.description = !isEmpty(data.description) ? data.description : '';

  data.url = !isEmpty(data.url) ? data.url : '';
  data.scriptCode = !isEmpty(data.scriptCode) ? data.scriptCode : '';
  // data.note = !isEmpty(data.note) ? data.note : '';

  data.title = !isEmpty(data.title) ? data.title : '';
  data.linkedin = !isEmpty(data.linkedin) ? data.linkedin : '';
  data.phone = !isEmpty(data.phone) ? data.phone : '';
  data.email = !isEmpty(data.email) ? data.email : '';

  if (Validator.isEmpty(data.type)) {
    errors.message = 'Type field is required!';
  }
  if (
    data.type !== 'card' &&
    data.type !== 'link' &&
    data.type !== 'code' &&
    data.type !== 'contact' &&
    data.type !== 'file'
  ) {
    errors.message = 'Invalid card type!';
  }

  if (data.type === 'link') {
    if (Validator.isEmpty(data.name)) {
      errors.message = 'Name field is required!';
    }

    if (Validator.isEmpty(data.description)) {
      errors.message = 'Description field is required';
    }

    if (
      !Validator.isEmpty(data.description) &&
      data.description.length > 5000
    ) {
      errors.message = 'Maximum 5000 characters allowed in description field!';
    }

    if (!Validator.isEmpty(data.name) && data.name.length > 50) {
      errors.message = 'Maximum 50 characters allowed in name field!';
    }

    if (Validator.isEmpty(data.url)) {
      errors.message = 'Url field is required!';
    }
    // if (Validator.isEmpty(data.note)) {
    //   errors.message = 'Note field is required!';
    // }

    // if (!Validator.isEmpty(data.note) && data.note.length > 240) {
    //   errors.message = 'Maximum 240 characters allowed in note field!';
    // }
  }
  if (data.type === 'code') {
    if (Validator.isEmpty(data.name)) {
      errors.message = 'Name field is required!';
    }

    if (Validator.isEmpty(data.description)) {
      errors.message = 'Description field is required';
    }

    if (
      !Validator.isEmpty(data.description) &&
      data.description.length > 5000
    ) {
      errors.message = 'Maximum 5000 characters allowed in description field!';
    }

    if (!Validator.isEmpty(data.name) && data.name.length > 50) {
      errors.message = 'Maximum 50 characters allowed in name field!';
    }

    if (Validator.isEmpty(data.scriptCode)) {
      errors.message = 'Script Code field is required!';
    }
  }
  if (data.type === 'card') {
    if (Validator.isEmpty(data.name)) {
      errors.message = 'Name field is required!';
    }

    if (Validator.isEmpty(data.description)) {
      errors.message = 'Description field is required';
    }

    if (
      !Validator.isEmpty(data.description) &&
      data.description.length > 5000
    ) {
      errors.message = 'Maximum 5000 characters allowed in description field!';
    }

    if (!Validator.isEmpty(data.name) && data.name.length > 50) {
      errors.message = 'Maximum 50 characters allowed in name field!';
    }

    // if (Validator.isEmpty(data.note)) {
    //   errors.message = 'Note field is required!';
    // }

    // if (!Validator.isEmpty(data.note) && data.note.length > 240) {
    //   errors.message = 'Maximum 240 characters allowed in note field!';
    // }
  }

  if (data.type === 'file') {
    if (Validator.isEmpty(data.name)) {
      errors.message = 'Name field is required!';
    }

    if (Validator.isEmpty(data.description)) {
      errors.message = 'Description field is required';
    }

    if (
      !Validator.isEmpty(data.description) &&
      data.description.length > 5000
    ) {
      errors.message = 'Maximum 5000 characters allowed in description field!';
    }

    if (!Validator.isEmpty(data.name) && data.name.length > 50) {
      errors.message = 'Maximum 20 characters allowed in name field!';
    }

    // if (Validator.isEmpty(data.note)) {
    //   errors.message = 'Note field is required!';
    // }

    // if (!Validator.isEmpty(data.note) && data.note.length > 240) {
    //   errors.message = 'Maximum 240 characters allowed in note field!';
    // }
  }

  if (data.type === 'contact') {
    if (Validator.isEmpty(data.name)) {
      errors.message = 'Name field is required!';
    }

    if (!Validator.isEmpty(data.name) && data.name.length > 50) {
      errors.message = 'Maximum 50 characters allowed in name field!';
    }

    if (Validator.isEmpty(data.title)) {
      errors.message = 'Title field is required!';
    }

    if (!Validator.isEmpty(data.title) && data.title.length > 30) {
      errors.message = 'Maximum 30 characters allowed in title field!';
    }

    if (Validator.isEmpty(data.phone)) {
      errors.message = 'Phone field is required!';
    }

    if (!Validator.isEmpty(data.phone) && data.phone.length > 20) {
      errors.message = 'Maximum 20 characters allowed in phone field!';
    }

    if (Validator.isEmpty(data.email)) {
      errors.message = 'Email field is required!';
    }

    if (!Validator.isEmpty(data.email) && data.email.length > 50) {
      errors.message = 'Maximum 50 characters allowed in email field!';
    }

    if (!Validator.isEmail(data.email)) {
      errors.message = 'Email is invalid!';
    }
    // if (Validator.isEmpty(data.linkedin)) {
    //   errors.message = 'linkedin field is required!';
    // }

    if (!Validator.isEmpty(data.linkedin) && data.linkedin.length > 100) {
      errors.message = 'Maximum 100 characters allowed in linkedin field!';
    }
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
