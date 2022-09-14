module.exports = {
  port: process.env.API_PORT || 8008,
  mongoURI: process.env.MONGO_URL,

  secretOrKey: process.env.JWT_SECRET || 'secret',
};
