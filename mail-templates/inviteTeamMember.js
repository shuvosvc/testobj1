const path = require('path');
const hbs = require('nodemailer-express-handlebars');

const { transport } = require('../util/permission');

require('dotenv').config();
const { DASHBOARD_URL, MESSANGER_MAIL } = process.env;

const jwt = require('jsonwebtoken');
const config = require('../config/keys');

async function inviteTeamMember(mailObj) {
  const { email, name } = mailObj;

  const token = jwt.sign(
    {
      email,
      teamName: name,
    },
    config.secretOrKey
  );

  try {
    const handlebarOptions = {
      viewEngine: {
        extName: '.handlebars',
        partialsDir: path.join(__dirname, '/handlebarTemplates'),
        defaultLayout: false,
      },
      viewPath: path.join(__dirname, '/handlebarTemplates'),
      extName: '.handlebars',
    };

    transport.use('compile', hbs(handlebarOptions));
    const verifyUrl = `${DASHBOARD_URL}/auth/guest?token=${token}`;

    const mailOptions = {
      from: MESSANGER_MAIL,
      to: email,
      subject: 'Invitation to team',
      template: 'inviteTeamMember',
      context: {
        // DASHBOARD_URL,
        verifyUrl,
      },
    };

    await transport.sendMail(mailOptions);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  inviteTeamMember,
};
