const path = require('path');
const hbs = require('nodemailer-express-handlebars');

const { transport } = require('../util/permission');

require('dotenv').config();
const { DASHBOARD_URL, MESSANGER_MAIL } = process.env;

async function sendNotification(mailObj) {
  const { name, email } = mailObj;

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
    const billingUrl = `${DASHBOARD_URL}/upgrade-plan`;

    const mailOptions = {
      from: MESSANGER_MAIL,
      to: email,
      subject: 'Free trial end',
      template: 'trialEnd',
      context: {
        name: name && name,
        billingUrl,
      },
    };

    await transport.sendMail(mailOptions);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  sendNotification,
};
