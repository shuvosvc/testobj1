exports.generateOtp = () => {
  return {
    otp: Math.floor(Math.random() * 90000) + 10000,
    otpExpiry: Date.now() + 3200000,
  };
};
