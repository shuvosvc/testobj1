const express = require('express');
const router = express.Router();

const teamControllers = require('../controllers/team');
const authMiddlewares = require('../middlewares/auth');

const Validator = require('validator');

const bodyParser = require('body-parser');

const multer = require('multer');
const fs = require('fs');
const path = require('path');
const uploadFolder = 'uploads';

const Team = require('../models/team');
const User = require('../models/user');

const validateMiddleware = require('../middlewares/validate');

const validateCreateTeam = require('../validations/team/create');
const validateUpdateTeam = require('../validations/team/update');

const { inviteTeamMember } = require('../mail-templates/inviteTeamMember');

const requireAuth = authMiddlewares.requireAuth;

router.get('/teamUrl/:string?', teamControllers.checkOutUrl);

router.get(
  '/allTeams/:search?',

  requireAuth,
  teamControllers.allTeams
);
router.get(
  '/ownTeams/:search?',

  requireAuth,
  teamControllers.ownTeams
);
router.get(
  '/sharedTeams/:search?',

  requireAuth,
  teamControllers.sharedTeams
);
router.get('/teamsearch/:name?', requireAuth, teamControllers.teamsearch);

router.get('/:siteName/:url', requireAuth, teamControllers.getTeam);

router.get(
  '/members/:url',

  requireAuth,
  teamControllers.members
);

router.delete(
  '/:url',

  requireAuth,

  teamControllers.deleteTeam
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

const urlencodedParser = bodyParser.urlencoded({ extended: false });

router.post(
  '/create',

  urlencodedParser,

  requireAuth,
  uploadImage,
  validateMiddleware(validateCreateTeam),

  teamControllers.checkUrl,
  async (req, res) => {
    try {
      const user = await User.find({ email: req.user.email });
      if (user.length === 0) {
        return res.status(404).json({
          message: 'User does not exist! ',
        });
      }
      if (user[0].membership === false && user[0].trialSeason === 0) {
        return res.status(403).json({
          message: 'Only paid members can create a team! ',
        });
      }
      const { name, invitedMembers, description } = req.body;

      let url = req.body.url.toLowerCase();

      const invited = invitedMembers.length;

      if (invited === 0) {
        const team = new Team({
          name,
          description,
          url,
          siteName: user[0].siteName,
          admin: req.user.id,
          teamMembers: req.user.id,
        });

        const savedTeam = await team.save();

        const updatedUser = await User.findOneAndUpdate(
          { email: req.user.email },
          { $push: { teams: savedTeam._id } },

          { new: true, useFindAndModify: false }
        );

        if (imgArr.length > 0) {
          const imgPath = `/attach/${imgArr[0]}`;
          const teamObj = await Team.findOneAndUpdate(
            { _id: savedTeam._id },
            {
              $set: {
                image: imgPath,
              },
            },
            { new: true, useFindAndModify: false }
          );
          imgArr.pop();

          return res.status(200).json({
            message: 'Team created successfully',
            team: teamObj,
          });
        } else {
          return res.status(200).json({
            message: 'Team created successfully',
            team: savedTeam,
          });
        }
      }
      if (invited > 0) {
        for (let i = 0; i < invited; i++) {
          if (!Validator.isEmail(invitedMembers[i])) {
            return res.status(402).json({
              message: `A mail is invalid!`,
            });

            break;
          }
        }

        const team = new Team({
          name,
          description,
          url: url,
          siteName: user[0].siteName,
          admin: req.user.id,
          teamMembers: req.user.id,
        });

        const savedTeam = await team.save();

        const updatedUser = await User.findOneAndUpdate(
          { email: req.user.email },
          { $push: { teams: savedTeam._id } },

          { new: true, useFindAndModify: false }
        );

        if (imgArr.length > 0) {
          const imgPath = `/attach/${imgArr[0]}`;
          await Team.findOneAndUpdate(
            { _id: savedTeam._id },
            {
              $set: {
                image: imgPath,
              },
            },
            { new: true, useFindAndModify: false }
          );
          imgArr.pop();
        }

        invitedMembers.map(async (email) => {
          const foundUser = await User.findOne({ email });
          if (foundUser != null) {
            await User.findOneAndUpdate(
              { email },
              { $push: { teams: savedTeam._id } },

              { new: true, useFindAndModify: false }
            );
            await Team.findOneAndUpdate(
              { _id: savedTeam._id },
              { $push: { teamMembers: foundUser._id } },

              { new: true, useFindAndModify: false }
            );

            inviteTeamMember({ email, name });
          } else {
            const user = new User({
              role: 'guest',
              email,
              teams: savedTeam._id,
            });

            const savedguestr = await user.save();

            await Team.findOneAndUpdate(
              { _id: savedTeam._id },
              { $push: { teamMembers: savedguestr._id } },

              { new: true, useFindAndModify: false }
            );
            inviteTeamMember({ email, name });
          }
        });
        const teamObj = await Team.find({ _id: savedTeam._id });

        return res.status(200).json({
          message: 'Team created successfully',
          team: teamObj[0],
        });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({
        message: 'Internal server error!',
      });
    }
  }
);

router.put(
  '/:url',

  urlencodedParser,

  requireAuth,
  uploadImage,

  validateMiddleware(validateUpdateTeam),

  async (req, res) => {
    try {
      // const { teamId, name, url, icon, userId } = req.body;

      const team = await Team.find({ url: req.params.url });

      if (team.length === 0) {
        return res.status(404).json({
          message: 'This team does not exist! ',
        });
      }

      if (team[0].admin != req.user.id) {
        return res.status(403).json({
          message: 'Only admin may update the team! ',
        });
      }

      if (req.body.url) {
        const exeUrl = await Team.findOne({ url: req.body.url });

        if (exeUrl && exeUrl.url !== team[0].url) {
          return res.status(403).json({
            message: 'This team url is already taken!',
          });
        }
      }

      const teamName = req.body.name ? req.body.name : team[0].name;
      const teamDescription = req.body.description
        ? req.body.description
        : team[0].description;
      let teamUrl = req.body.url ? req.body.url : team[0].url;

      const invitedMembers = req.body.invitedMembers
        ? req.body.invitedMembers
        : [];

      const invited = invitedMembers.length;

      const exMembers = team[0].teamMembers;

      teamUrl = teamUrl.toLowerCase();

      if (imgArr.length > 0 && team[0].image) {
        const filePath = path.resolve(
          `uploads/${team[0].image?.split('/')[2]}`
        );

        await fs.unlink(filePath, function (err) {
          if (err) {
            return res.status(404).json({
              message: 'Could not found the image!',
            });
          }
        });
      }

      if (invited === 0) {
        await Team.findOneAndUpdate(
          { url: req.params.url },
          {
            $set: {
              name: teamName,
              url: teamUrl,
              description: teamDescription,
            },
          },
          { new: true, useFindAndModify: false }
        );

        if (imgArr.length > 0) {
          const imgPath = `/attach/${imgArr[0]}`;
          await Team.findOneAndUpdate(
            { url: teamUrl },
            {
              $set: {
                image: imgPath,
              },
            },
            { new: true, useFindAndModify: false }
          );
          imgArr.pop();
        }

        const emptyTeam = await Team.findOneAndUpdate(
          { url: teamUrl },
          { $pull: { teamMembers: { $ne: req.user._id } } },

          { new: true, useFindAndModify: false }
        );

        for (let i = 0; i < exMembers.length; i++) {
          if (exMembers[i] != team[0].admin) {
            await User.findOneAndUpdate(
              { _id: exMembers[i] },
              { $pull: { teams: team[0].id } },

              { new: true, useFindAndModify: false }
            );
          }
        }

        await User.findOneAndUpdate(
          { _id: req.user._id },
          { $push: { teams: team[0]._id } },

          { new: true, useFindAndModify: false }
        );
        return res.status(200).json({
          message: 'Team updated successfully',
          team: emptyTeam,
        });
      }

      if (invited > 0) {
        for (let i = 0; i < invited; i++) {
          if (!Validator.isEmail(invitedMembers[i])) {
            return res.status(402).json({
              message: `A mail is invalid!`,
            });

            break;
          }
        }

        await Team.findOneAndUpdate(
          { url: req.params.url },
          {
            $set: {
              teamMembers: [],
              name: teamName,
              description: teamDescription,
              url: teamUrl.toLowerCase(),
            },
          },
          { new: true, useFindAndModify: false }
        );
        if (imgArr.length > 0) {
          const imgPath = `/attach/${imgArr[0]}`;
          await Team.findOneAndUpdate(
            { url: teamUrl },
            {
              $set: {
                image: imgPath,
              },
            },
            { new: true, useFindAndModify: false }
          );
          imgArr.pop();
        }

        for (let i = 0; i < invitedMembers.length; i++) {
          let email = invitedMembers[i];
          const foundUser = await User.findOne({ email });

          if (foundUser != null) {
            const checkExt = exMembers.includes(foundUser._id);

            if (checkExt) {
              await Team.findOneAndUpdate(
                { url: teamUrl },
                { $push: { teamMembers: foundUser._id } },

                { new: true, useFindAndModify: false }
              );
            } else {
              await User.findOneAndUpdate(
                { email },
                { $push: { teams: team[0]._id } },

                { new: true, useFindAndModify: false }
              );

              const updatedTeam = await Team.findOneAndUpdate(
                { url: teamUrl },
                { $push: { teamMembers: foundUser._id } },

                { new: true, useFindAndModify: false }
              );

              inviteTeamMember({ email, name: teamName });
            }
          } else {
            const user = new User({
              role: 'guest',
              email,
              teams: team[0]._id,
            });

            const savedguestr = await user.save();

            await Team.findOneAndUpdate(
              { url: teamUrl },
              { $push: { teamMembers: savedguestr._id } },

              { new: true, useFindAndModify: false }
            );

            inviteTeamMember({ email, name: teamName });
          }
        }

        const newTeam = await Team.find({ url: teamUrl });
        const newMembers = newTeam[0].teamMembers;

        exMembers.map(async (exmem) => {
          const stillext = newMembers.includes(exmem);

          if (!stillext) {
            await User.findOneAndUpdate(
              { _id: exmem },
              { $pull: { teams: newTeam[0].id } },

              { new: true, useFindAndModify: false }
            );
          }
        });

        const upTeam = await Team.findOneAndUpdate(
          { url: teamUrl },
          { $push: { teamMembers: req.user._id } },

          { new: true, useFindAndModify: false }
        );
        await User.findOneAndUpdate(
          { _id: req.user._id },
          { $push: { teams: newTeam[0]._id } },

          { new: true, useFindAndModify: false }
        );

        res.status(200).json({
          team: upTeam,
          message: 'Team updated successfully',
        });
      }
    } catch (err) {
      res.status(500).json({
        message: 'Internal server error!!!',
      });
    }
  }
);

module.exports = router;
