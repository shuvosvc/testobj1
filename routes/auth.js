const express = require('express');

const createToken = require('../helpers/generateToken');

const authControllers = require('../controllers/auth');
const authMiddlewares = require('../middlewares/auth');

const validateMiddleware = require('../middlewares/validate');
const validateLogin = require('../validations/auth/login');
const validateRegister = require('../validations/auth/register');

const validatePassword = require('../validations/auth/password');
const validateOtp = require('../validations/auth/otp');
const validateResetPassword = require('../validations/auth/passReset');
const validateUserUpdate = require('../validations/auth/userUpdate');

const validEmail = require('../validations/auth/email');

const User = require('../models/user');

const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadFolder = 'uploads';

const router = express.Router();

const requireAuth = authMiddlewares.requireAuth;

router.get('/users/:string?', requireAuth, authControllers.getUsers);
router.get('/siteName/:string?', authControllers.checkOutSiteName);

router.get(
  '/existUser/:email',

  authControllers.existUser
);

router.post('/checkUser', authControllers.checkUser);

router.post('/me', requireAuth, authControllers.me);

router.post(
  '/signup',

  validateMiddleware(validateRegister),
  authControllers.checkUser,
  authControllers.signUp
);
router.post(
  '/sendEmailAgain',

  requireAuth,
  authControllers.sendEmailAgain
);
router.put(
  '/guestsignup',

  validateMiddleware(validatePassword),
  authControllers.guestsignup
);
router.put('/activeEmail', authControllers.activeEmail);
router.post(
  '/signin',

  validateMiddleware(validateLogin),
  authControllers.signIn
);

router.post('/googleAuth', authControllers.googleAuth);

router.put(
  '/updateUser',
  requireAuth,
  validateMiddleware(validateUserUpdate),

  authControllers.updateUser
);

router.post(
  '/forgetPassword',

  validateMiddleware(validEmail),
  authControllers.forgetPassword
);
router.post(
  '/matchOtp',

  validateMiddleware(validateOtp),
  authControllers.matchOtp
);
router.put(
  '/resetPassword',
  requireAuth,
  validateMiddleware(validateResetPassword),
  authControllers.resetPassword
);

const imgArr = [];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);

    const fileName =
      file.originalname
        .replace(fileExt, '')
        .toLowerCase()
        .split(' ')
        .join('_') +
      '_' +
      Date.now();

    const name = fileName + fileExt;
    imgArr.push(name);

    cb(null, name);
    return name;
  },
});

// storage control end ----------------
const upload = multer({
  storage: storage,

  limits: {
    fileSize: 80000000,
  },

  preservePath: uploadFolder,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'images') {
      if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/svg+xml'
      ) {
        cb(null, true);
      } else {
        cb(new Error('only .jpg, .png, .jpeg , .svg format allowed'));
      }
    } else {
      cb(new Error('wrong feild !!!'));
    }
  },
}).fields([{ name: 'images', maxCount: 1 }]);

function uploadImage(req, res, next) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(403).json({
        message: 'Image size can not exceed 10Mb!',
      });
    } else if (err) {
      return res.status(403).json({
        message: err.message,
      });
    }

    next();
  });
}

router.put('/updateUserImage', requireAuth, uploadImage, async (req, res) => {
  try {
    const user = await User.find({ email: req.user.email });
    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exist!',
      });
    }
    if (!imgArr.length) {
      return res.status(404).json({
        message: 'No image found!',
        token,
      });
    }

    if (user[0].image) {
      const filePath = path.resolve(`uploads/${user[0].image?.split('/')[2]}`);

      await fs.unlink(filePath, function (err) {
        if (err) {
          return res.status(404).json({
            message: 'Could not found the image!',
          });
        }
      });
    }

    const imgPath = `/attach/${imgArr[0]}`;

    const updated = await User.findOneAndUpdate(
      { email: req.user.email },
      {
        $set: {
          image: imgPath,
        },
      },
      { new: true, useFindAndModify: false }
    );
    imgArr.pop();
    const token = createToken.generateToken(updated);
    res.status(200).json({
      message: 'User image updated successfully!',
      token,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Internal servere error!!',
    });
  }
});

router.post('/signout', requireAuth, authControllers.signOut);
router.post('/user', requireAuth, authControllers.viewProfile);

module.exports = router;
