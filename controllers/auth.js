const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');
const config = require('../config/keys');
const User = require('../models/user');

const Validator = require('validator');

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLOUD_CLIENT_ID);

const { createHash } = require('../util/permission');
const setUserInfo = require('../helpers/user').setUserInfo;

const Secret_Key = process.env.STRIPE_SEC_KEY;
const stripe = require('stripe')(Secret_Key);
const createToken = require('../helpers/generateToken');
const createOtp = require('../helpers/generateOtp');

const { sendEmailVerification } = require('../mail-templates/emailverify');
const { sendResetEmail } = require('../mail-templates/resetPass');

exports.me = async function (req, res) {
  try {
    const token = createToken.generateToken(req.user);

    res.status(200).json({
      token,
    });
  } catch (err) {
    res.status(500).json({
      message: 'token err',
    });
  }
};

exports.checkOutSiteName = async function (req, res) {
  try {
    const string = req.params.string;

    if (string) {
      const user = await User.findOne({
        siteName: string,
      });
      if (user) {
        return res.status(200).json({
          isSiteName: true,
        });
      } else {
        return res.status(200).json({
          isSiteName: false,
        });
      }
    } else {
      return res.status(200).json({
        isSiteName: false,
      });
    }
  } catch (err) {
    return res.status(200).json({
      isSiteName: false,
    });
  }
};
exports.getUsers = async function (req, res) {
  try {
    if (req.user.membership === false && req.user.trialSeason === 0) {
      return res.status(403).json({
        message: 'Only paid member may view user list!',
      });
    }
    const string = req.params.string;

    if (string) {
      const users = await User.aggregate([
        {
          $match: {
            $or: [
              {
                name: { $regex: `${string}`, $options: 'i' },
              },
              {
                email: { $regex: `${string}`, $options: 'i' },
              },
            ],
          },
        },
        {
          $match: {
            $or: [
              {
                name: { $ne: req.user.name },
              },
              {
                email: { $ne: req.user.email },
              },
            ],
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            image: 1,
            w: {
              $cond: [
                { $eq: [{ $substr: [{ $toLower: '$name' }, 0, 1] }, 'r'] },
                1,
                0,
              ],
            },
          },
        },
        { $sort: { w: -1 } },
      ]).limit(20);

      return res.status(200).json({
        users,
      });
    } else {
      const users = await User.aggregate([
        {
          $match: {
            email: { $ne: req.user.email },
          },
        },

        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            image: 1,
          },
        },
      ]).limit(20);

      return res.status(200).json({
        users,
      });
    }
  } catch (err) {
    return res.status(200).json({
      users: [],
    });
  }
};

exports.existUser = async function (req, res) {
  try {
    const email = req.params.email;

    const exemail = await User.findOne({ email });

    if (exemail) {
      res.status(200).json({
        isExist: true,
        activeStatus: exemail.activeStatus,
      });
    } else {
      res.status(200).json({
        isExist: false,
        activeStatus: false,
      });
    }
  } catch (err) {
    res.status(500).send({ message: 'Internal server error!' });
  }
};
exports.checkUser = async function (req, res, next) {
  try {
    const { email, siteName } = req.body;

    const exemail = await User.findOne({ email });

    if (exemail) {
      res.status(403).json({
        message: 'This mail is already used!',
      });
    } else {
      const exsiteName = await User.findOne({ siteName });
      if (exsiteName) {
        res.status(403).json({
          message: 'This sitename is already used!',
        });
      } else {
        next();
      }
    }
  } catch (err) {
    res.status(500).send({ message: 'Internal server error!' });
  }
};

exports.signUp = async function (req, res) {
  try {
    const { email, password, siteName, name } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 10);

    const { otp, otpExpiry } = createOtp.generateOtp();

    const user = new User({
      role: 'member',
      siteName,
      email,
      password: hashedPassword,
      activeEmailOtp: otp,
      activeEmailOtpExpiry: otpExpiry,
      name,
      trialSeason: 14,
    });

    const savedUser = await user.save();

    const token = createToken.generateToken({
      _id: savedUser._id,
      email,
      siteName,
      activeStatus: false,
      name,
      image: null,
      membership: true,
      billing: null,
    });
    await sendEmailVerification({
      name,
      email,
      otp,
    });

    res.status(200).json({
      message: 'Signed up successfuly',
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Internal server error!' });
  }
};
exports.sendEmailAgain = async function (req, res) {
  try {
    const user = await User.find({ email: req.user.email });
    if (user.length === 0) {
      return res.status(404).json({
        message: 'This mail is not listed! ',
      });
    }
    if (user[0].activeStatus === true) {
      return res.status(403).json({
        message: 'This mail is already active! ',
      });
    }

    const { otp, otpExpiry } = createOtp.generateOtp();

    const updated = await User.findOneAndUpdate(
      { email: req.user.email },
      {
        $set: {
          activeEmailOtp: otp,
          activeEmailOtpExpiry: otpExpiry,
        },
      },
      { new: true, useFindAndModify: false }
    );

    await sendEmailVerification({
      name: req.user.name,
      email: req.user.email,
      otp,
    });

    res.status(200).json({
      message: 'Active mail is sent again',
    });
  } catch (err) {
    res.status(500).send({ message: 'Internal server error!' });
  }
};
exports.guestsignup = async function (req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.find({ email });
    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exist! ',
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const customer = await stripe.customers.create({
      email: email,
    });

    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          activeStatus: true,

          role: 'guest',

          password: hashedPassword,
          customerId: customer.id,
        },
      },
      { new: true, useFindAndModify: false }
    );

    const token = createToken.generateToken(updatedUser);

    res.status(200).json({
      message: 'Signed up successfuly',
      token,
    });
  } catch (err) {
    res.status(501).send({ message: 'Signup failed' });
  }
};

exports.signIn = async function (req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.find({ email });

    const isValidPassword = bcrypt.compareSync(password, user[0].password);

    if (isValidPassword) {
      const token = createToken.generateToken(user[0]);
      res.status(200).json({
        token,
      });
    } else {
      res.status(404).json({
        message: 'Password incorrect',
      });
    }
  } catch (err) {
    res.status(404).json({
      message: 'User does not exist!!',
    });
  }
};

exports.googleAuth = async function (req, res) {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID,
    });
    if (!ticket.payload) {
      return res.status(404).json({
        message: 'Link is expired!!',
      });
    }

    const { name, email, picture } = ticket.getPayload();

    const user = await User.find({ email });
    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exist! ',
      });
    }

    const userName = user[0].name != null ? user[0].name : name;
    const userPicture = user[0].image != null ? user[0].image : picture;

    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name: userName,
          image: userPicture,
        },
      },
      { new: true, useFindAndModify: false }
    );

    const gToken = createToken.generateToken(updatedUser);

    res.status(200).json({
      token: gToken,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error!!',
    });
  }
};

exports.activeEmail = async function (req, res) {
  try {
    const { otp, email } = req.body;

    const user = await User.find({ email });
    if (user.length === 0) {
      res.status(404).json({
        message: 'User does not exist! ',
      });
    } else {
      if (user[0].activeEmailOtp === otp) {
        if (user[0].activeEmailOtpExpiry >= Date.now()) {
          const updatedUser = await User.findOneAndUpdate(
            { email },
            {
              $set: {
                activeStatus: true,
                activeEmailOtp: null,
                activeEmailOtpExpiry: null,
              },
            },
            { new: true, useFindAndModify: false }
          );

          const token = createToken.generateToken(updatedUser);

          res.status(200).json({
            message: 'Active status  was updated successfully',
            token,
          });
        } else {
          res.status(404).json({
            message: 'The otp is expired !',
          });
        }
      } else {
        res.status(404).json({
          message: 'The otp is expired !',
        });
      }
    }
  } catch (err) {
    res.status(500).send({ message: 'Internal server error!' });
  }
};

exports.updateUser = async function (req, res) {
  try {
    // const {  name,email,sitename, password } = req.body;

    const user = await User.find({ email: req.user.email });
    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exist!',
      });
    }

    const exemail = await User.findOne({ email: req.body.email });

    if (exemail && exemail.email != user[0].email) {
      return res.status(403).json({
        message: 'This mail is already used',
      });
    }
    const exSiteName = await User.findOne({ siteName: req.body.siteName });
    if (exSiteName && exSiteName.email != user[0].email) {
      return res.status(403).json({
        message: 'This sitename is already used',
      });
    }

    if (
      user[0].role === 'guest' &&
      user[0].membership === false &&
      user[0].trialSeason === 0 &&
      req.body.siteName
    ) {
      return res.status(403).json({
        message: 'Only paid members may update site name!!',
      });
    }

    const name = req.body.name ? req.body.name : user[0].name;
    const email = req.body.email ? req.body.email : user[0].email;
    const siteName = req.body.siteName ? req.body.siteName : user[0].siteName;

    const password = req.body.password
      ? bcrypt.hashSync(req.body.password, 10)
      : user[0].password;

    if (req.body.email) {
      await stripe.customers.update(user[0].customerId, {
        email: req.body.email,
      });

      const { otp, otpExpiry } = createOtp.generateOtp();

      const emailUpdated = await User.findOneAndUpdate(
        { email: req.user.email },
        {
          $set: {
            name,
            email,
            activeStatus: false,
            siteName,
            password,
            activeEmailOtp: otp,
            activeEmailOtpExpiry: otpExpiry,
          },
        },
        { new: true, useFindAndModify: false }
      );

      await sendEmailVerification({
        name: name != null ? name : '',
        email,
        otp,
      });

      const token = createToken.generateToken(emailUpdated);
      return res.status(200).json({
        message: 'User updated successfully!',
        token,
      });
    } else {
      const updated = await User.findOneAndUpdate(
        { email: req.user.email },
        {
          $set: {
            name,
            siteName,
            password,
          },
        },
        { new: true, useFindAndModify: false }
      );

      const token = createToken.generateToken(updated);

      return res.status(200).json({
        message: 'User updated successfully!',
        token,
      });
    }
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error!!',
    });
  }
};

exports.forgetPassword = async function (req, res) {
  try {
    const email = req.body.email;
    // const forgetEmailToken = await createHash();
    // const forgetEmailTokenExpiry = Date.now() + 7200000;

    const { otp, otpExpiry } = createOtp.generateOtp();

    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          forgetEmailOtp: otp,
          forgetEmailOtpExpiry: otpExpiry,
        },
      }
    );

    if (!user) {
      res.status(404).json({
        message: 'User does not exist! ',
      });
    } else {
      if (user.name === null) {
        const emailObj = {
          name: '',
          email,
          otp,
        };
        await sendResetEmail(emailObj);
      } else {
        const emailObj = {
          name: user.name,
          email,
          otp,
        };
        await sendResetEmail(emailObj);
      }

      res.status(200).json({
        message: 'Forget password email sent , please check your email.',
        email,
      });
    }
  } catch (err) {
    res.status(500).json({
      message: 'Internal erver error!',
    });
  }
};

exports.matchOtp = async function (req, res) {
  try {
    const { otp, email } = req.body;

    const user = await User.find({ email });
    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exist! ',
      });
    }
    if (user[0].forgetEmailOtp != otp) {
      return res.status(404).json({
        message: 'Your link is expired ! ',
      });
    }
    if (user[0].forgetEmailOtpExpiry <= Date.now()) {
      return res.status(404).json({
        message: 'Your link is expired55 ! ',
      });
    }

    const token = jwt.sign(
      {
        email,
        forgetEmailOtp: user[0].forgetEmailOtp,
      },
      config.secretOrKey,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Otp matched',
      token,
    });
  } catch (err) {
    res.status(500).send({ message: 'Internal server error!!' });
  }
};
exports.resetPassword = async function (req, res) {
  try {
    const { password } = req.body;

    const user = await User.find({ email: req.user.email });
    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exist! ',
      });
    }
    if (user[0].forgetEmailOtp != req.user.forgetEmailOtp) {
      return res.status(404).json({
        message: 'Your link is expired ! ',
      });
    }
    if (user[0].forgetEmailOtpExpiry <= Date.now()) {
      return res.status(404).json({
        message: 'Your link is expired ! ',
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const updatedUser = await User.findOneAndUpdate(
      { email: req.user.email },
      {
        $set: {
          password: hashedPassword,
          forgetEmailOtp: null,
          forgetEmailOtpExpiry: null,
        },
      },
      { new: true, useFindAndModify: false }
    );

    const token = createToken.generateToken(updatedUser);

    res.status(200).json({
      message: 'Password was reset successfully',
      token,
    });
  } catch (err) {
    res.status(500).send({ message: 'Internal server error!!' });
  }
};

exports.signOut = function (req, res) {
  req.logout();

  res.status(200).json({ message: 'Successfully logged out' });
};

exports.viewProfile = function (req, res) {
  User.findOne({ email: req.user.email })
    .then((foundUser) => {
      res.status(200).json({
        success: true,
        user: setUserInfo(foundUser),
      });
    })
    .catch((err) => {
      res.status(404).send({ message: 'User not found' });
    });
};
