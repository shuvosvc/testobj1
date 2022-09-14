exports.charecterChecker = (val) => {
  const trimed = val.trim();
  const usernameRegex = /^[A-Za-z0-9_-]+$/;
  return usernameRegex.test(trimed);
};
