const fs = require('fs');
const path = require('path');
const Project = require('../models/project');
const Card = require('../models/card');
const User = require('../models/user');
const Team = require('../models/team');

const jwt = require('jsonwebtoken');

const config = require('../config/keys');

exports.getCards = async function (req, res) {
  try {
    const project = await Project.find({ slug: req.params.projectSlug });

    if (project.length === 0) {
      return res.status(404).json({
        message: 'This project does not exist! ',
      });
    }
    const team = await Team.find({ _id: project[0].team });

    if (project[0].private === true) {
      let isAuth = false;
      const authorization = req.headers?.authorization;
      if (authorization) {
        const dt = authorization?.split(' ')[1];
        if (dt !== 'null') {
          isAuth = true;
        } else {
          isAuth = false;
        }
      }

      if (!isAuth) {
        return res.status(200).json({
          private: true,
        });
      }
      const token = authorization.split(' ')[1];

      req.user = jwt.verify(token, config.secretOrKey);

      if (Date.now() >= req.user.exp * 1000) {
        return res.status(401).json({
          message: 'Unauthorized !',
        });
      }

      const user = await User.find({ email: req.user.email });

      if (user.length === 0) {
        return res.status(404).json({
          message: 'User does not exist! ',
        });
      }

      const isMember = team[0].teamMembers.includes(req.user.id);

      if (!isMember) {
        return res.status(200).json({
          private: true,
        });
      } else {
        const string = req.params.search;

        if (string !== undefined) {
          const extCard = await Card.aggregate([
            {
              $match: {
                projectId: { $eq: project[0]._id },
              },
            },
            { $match: { name: { $regex: `${string}`, $options: 'i' } } },
            {
              $project: {
                name: 1,
                type: 1,
                note: 1,
                url: 1,
                title: 1,
                file: 1,
                email: 1,
                phone: 1,
                address: 1,

                slug: 1,
                projectId: 1,

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
            cards: extCard,
          });
        } else {
          const extCard = await Card.aggregate([
            {
              $match: {
                projectId: { $eq: project[0]._id },
              },
            },
          ]);

          return res.status(200).json({
            cards: extCard,
          });
        }
      }
    } else {
      const string = req.params.search;

      if (string !== undefined) {
        const extCard = await Card.aggregate([
          {
            $match: {
              projectId: { $eq: project[0]._id },
            },
          },
          { $match: { name: { $regex: `${string}`, $options: 'i' } } },
          {
            $project: {
              name: 1,
              type: 1,
              note: 1,
              url: 1,
              title: 1,
              file: 1,
              email: 1,
              phone: 1,
              address: 1,

              slug: 1,
              projectId: 1,

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
          cards: extCard,
        });
      } else {
        const extCard = await Card.aggregate([
          {
            $match: {
              projectId: { $eq: project[0]._id },
            },
          },
        ]);

        return res.status(200).json({
          cards: extCard,
        });
      }
    }
  } catch (err) {
    res.status(500).json({
      message: 'Internal servere error!!',
    });
  }
};
exports.getCard = async function (req, res) {
  try {
    const user = await User.find({ email: req.user.email });
    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exist!',
      });
    }

    const project = await Project.find({ slug: req.params.projectSlug });

    if (project.length === 0) {
      return res.status(404).json({
        message: 'This project does not exist! ',
      });
    }

    const team = await Team.find({ _id: project[0].team });

    const isMember = team[0].teamMembers.includes(req.user.id);

    if (!isMember) {
      return res.status(200).json({
        private: true,
      });
    } else {
      const extCard = await Card.aggregate([
        {
          $match: {
            projectId: { $eq: project[0]._id },
          },
        },
        {
          $match: {
            slug: { $eq: req.params.cardSlug },
          },
        },
      ]);

      return res.status(200).json({
        card: extCard[0],
      });
    }
  } catch (err) {
    res.status(500).json({
      message: 'Internal servere error!!',
    });
  }
};

exports.deleteCard = async function (req, res) {
  try {
    const user = await User.find({ email: req.user.email });
    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exist!',
      });
    }

    const project = await Project.find({ slug: req.params.projectSlug });

    if (project.length === 0) {
      return res.status(404).json({
        message: 'This project does not exist! ',
      });
    }

    const extCard = await Card.aggregate([
      {
        $match: {
          projectId: { $eq: project[0]._id },
        },
      },
      {
        $match: {
          slug: { $eq: req.params.cardSlug },
        },
      },
    ]);

    if (extCard.length === 0) {
      return res.status(404).json({
        message: 'This card does not exist! ',
      });
    }

    if (project[0].creator.toString() !== user[0].id.toString()) {
      return res.status(403).json({
        message: 'Only  admin may delete card ! ',
      });
    }

    if (extCard[0].type === 'file') {
      const filePath = path.resolve(
        `uploads/${extCard[0].file?.split('/')[2]}`
      );

      await fs.unlink(filePath, function (err) {
        if (err) {
          return res.status(404).json({
            message: 'Could not found the file!',
          });
        }
      });
    }

    await Project.findOneAndUpdate(
      { _id: project[0]._id },
      { $pull: { cards: extCard[0]._id } },

      { new: true, useFindAndModify: false }
    );

    await Card.deleteOne({ _id: extCard[0]._id });

    res.status(200).json({
      message: 'Successfully deleted card',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Internal servere error!!',
    });
  }
};
