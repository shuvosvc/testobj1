const express = require('express');
const router = express.Router();

const Validator = require('validator');
const isEmpty = require('../validations/is-empty');

const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadFolder = 'uploads';

const validateMiddleware = require('../middlewares/validate');
const validCard = require('../validations/card/create');
const cardControllers = require('../controllers/card');

const Project = require('../models/project');
const Card = require('../models/card');
const User = require('../models/user');

const authMiddlewares = require('../middlewares/auth');
const requireAuth = authMiddlewares.requireAuth;

router.delete(
  '/:projectSlug/:cardSlug',
  requireAuth,
  cardControllers.deleteCard
);
router.get(
  '/getAllCards/:projectSlug/:search?',

  cardControllers.getCards
);
router.get('/:projectSlug/:cardSlug', requireAuth, cardControllers.getCard);

const fileArr = [];

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
    fileArr.push({ name: name, fileOrginalName: file.originalname });

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
    if (file.fieldname === 'files') {
      if (
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/svg+xml'
      ) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'));
      }
    } else {
      cb(new Error('Wrong feild !!!'));
    }
  },
}).fields([{ name: 'files', maxCount: 1 }]);

function uploadFile(req, res, next) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(403).json({
        message: 'File size can not exceed 10Mb!',
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
  '/:projectSlug',

  urlencodedParser,

  requireAuth,
  uploadFile,
  validateMiddleware(validCard),
  async (req, res) => {
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

      if (project[0].creator.toString() !== user[0].id.toString()) {
        return res.status(403).json({
          message: 'Only  admin may create card ! ',
        });
      }
      if (req.body.type === 'link') {
        const card = new Card({
          name: req.body.name,
          url: req.body.url,
          // note: req.body.note,
          type: req.body.type,
          description: req.body.description,
          projectId: project[0]._id,
        });

        await card.save();

        await Project.findOneAndUpdate(
          { _id: project[0]._id },
          { $push: { cards: card._id } },

          { new: true, useFindAndModify: false }
        );

        return res.status(200).json({
          message: 'Card added successfully!',
        });
      }
      if (req.body.type === 'code') {
        const card = new Card({
          name: req.body.name,
          scriptCode: req.body.scriptCode,
          // note: req.body.note,
          type: req.body.type,
          description: req.body.description,
          projectId: project[0]._id,
        });

        await card.save();

        await Project.findOneAndUpdate(
          { _id: project[0]._id },
          { $push: { cards: card._id } },

          { new: true, useFindAndModify: false }
        );

        return res.status(200).json({
          message: 'Card added successfully!',
        });
      }
      if (req.body.type === 'card') {
        const card = new Card({
          name: req.body.name,
          // note: req.body.note,
          type: req.body.type,
          description: req.body.description,
          projectId: project[0]._id,
        });

        await card.save();

        await Project.findOneAndUpdate(
          { _id: project[0]._id },
          { $push: { cards: card._id } },

          { new: true, useFindAndModify: false }
        );

        return res.status(200).json({
          message: 'Card added successfully!',
        });
      }
      if (req.body.type === 'contact') {
        if (fileArr.length > 0) {
          const filePath = `/attach/${fileArr[0].name}`;

          const card = new Card({
            name: req.body.name,
            title: req.body.title,
            phone: req.body.phone,
            email: req.body.email,
            linkedin: req.body.linkedin ? req.body.linkedin : null,
            type: req.body.type,
            projectId: project[0]._id,
            contactImage: filePath,
          });

          await card.save();
          fileArr.pop();
          await Project.findOneAndUpdate(
            { _id: project[0]._id },
            { $push: { cards: card._id } },

            { new: true, useFindAndModify: false }
          );

          return res.status(200).json({
            message: 'Card added successfully!',
          });
        } else {
          return res.status(501).json({
            message: 'File was not uploaded!',
          });
        }
      }

      if (req.body.type === 'file') {
        if (fileArr.length > 0) {
          const filePath = `/attach/${fileArr[0].name}`;

          const card = new Card({
            name: req.body.name,
            // note: req.body.note,
            description: req.body.description,
            file: filePath,
            fileOrginalName: fileArr[0].fileOrginalName,
            type: req.body.type,
            projectId: project[0]._id,
          });

          await card.save();
          fileArr.pop();
          await Project.findOneAndUpdate(
            { _id: project[0]._id },
            { $push: { cards: card._id } },

            { new: true, useFindAndModify: false }
          );

          return res.status(200).json({
            message: 'Card added successfully!',
          });
        } else {
          return res.status(501).json({
            message: 'File was not uploaded!',
          });
        }
      }
    } catch (err) {
      console.log(err.message);
      res.status(500).json({
        message: 'Internal server error!!',
      });
    }
  }
);

router.put(
  '/:projectSlug/:cardSlug',

  urlencodedParser,
  requireAuth,
  uploadFile,

  async (req, res) => {
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
          message: 'Only  admin may update card ! ',
        });
      }

      if (extCard[0].type === 'link') {
        const tempName = req.body.name ? req.body.name : '';
        if (!Validator.isEmpty(tempName)) {
          if (!Validator.isLength(tempName, { min: 1 })) {
            return res.status(401).json({
              message: 'Name field is required!',
            });
          }

          if (tempName.length > 50) {
            return res.status(401).json({
              message: 'Maximum 50 characters allowed in name field!',
            });
          }
        }

        const temUrl = req.body.url ? req.body.url : '';
        if (!Validator.isEmpty(temUrl)) {
          if (!Validator.isLength(temUrl, { min: 1 })) {
            return res.status(402).json({
              message: 'Url field is required!',
            });
          }
        }

        // const tempNote = req.body.note ? req.body.note : '';
        // if (!Validator.isEmpty(tempNote)) {
        //   if (!Validator.isLength(tempNote, { min: 1 })) {
        //     return res.status(402).json({
        //       message: 'Note field is required!',
        //     });
        //   }

        //   if (tempNote.length > 240) {
        //     return res.status(401).json({
        //       message: 'Maximum 240 characters allowed in note field!',
        //     });
        //   }
        // }

        const tempDescription = req.body.description
          ? req.body.description
          : '';
        if (!Validator.isEmpty(tempDescription)) {
          if (!Validator.isLength(tempDescription, { min: 1 })) {
            return res.status(401).json({
              message: 'Description field is required!',
            });
          }

          if (tempDescription.length > 5000) {
            return res.status(401).json({
              message: 'Maximum 5000 characters allowed in description field!',
            });
          }
        }

        const description = req.body.description
          ? req.body.description
          : extCard[0].description;
        const name = req.body.name ? req.body.name : extCard[0].name;
        const url = req.body.url ? req.body.url : extCard[0].url;
        // const note = req.body.note ? req.body.note : extCard[0].note;

        const updated = await Card.findOneAndUpdate(
          { projectId: project[0]._id, slug: req.params.cardSlug },
          {
            $set: {
              name,
              description,
              url,
              // note,
            },
          },
          { new: true, useFindAndModify: false }
        );

        return res.status(200).json({
          message: 'Card updated successfully!',
        });
      }
      if (extCard[0].type === 'code') {
        const tempName = req.body.name ? req.body.name : '';
        if (!Validator.isEmpty(tempName)) {
          if (!Validator.isLength(tempName, { min: 1 })) {
            return res.status(401).json({
              message: 'Name field is required!',
            });
          }

          if (tempName.length > 50) {
            return res.status(401).json({
              message: 'Maximum 50 characters allowed in name field!',
            });
          }
        }

        const temScriptCode = req.body.scriptCode ? req.body.scriptCode : '';
        if (!Validator.isEmpty(temScriptCode)) {
          if (!Validator.isLength(temScriptCode, { min: 1 })) {
            return res.status(402).json({
              message: 'Script Code field is required!',
            });
          }
        }

        // const tempNote = req.body.note ? req.body.note : '';
        // if (!Validator.isEmpty(tempNote)) {
        //   if (!Validator.isLength(tempNote, { min: 1 })) {
        //     return res.status(402).json({
        //       message: 'Note field is required!',
        //     });
        //   }

        //   if (tempNote.length > 240) {
        //     return res.status(401).json({
        //       message: 'Maximum 240 characters allowed in note field!',
        //     });
        //   }
        // }

        const tempDescription = req.body.description
          ? req.body.description
          : '';
        if (!Validator.isEmpty(tempDescription)) {
          if (!Validator.isLength(tempDescription, { min: 1 })) {
            return res.status(401).json({
              message: 'Description field is required!',
            });
          }

          if (tempDescription.length > 5000) {
            return res.status(401).json({
              message: 'Maximum 5000 characters allowed in description field!',
            });
          }
        }

        const description = req.body.description
          ? req.body.description
          : extCard[0].description;
        const name = req.body.name ? req.body.name : extCard[0].name;
        const scriptCode = req.body.scriptCode
          ? req.body.scriptCode
          : extCard[0].scriptCode;
        // const note = req.body.note ? req.body.note : extCard[0].note;

        const updated = await Card.findOneAndUpdate(
          { projectId: project[0]._id, slug: req.params.cardSlug },
          {
            $set: {
              name,
              description,
              scriptCode,
              // note,
            },
          },
          { new: true, useFindAndModify: false }
        );

        return res.status(200).json({
          message: 'Card updated successfully!',
        });
      }

      if (extCard[0].type === 'card') {
        const tempName = req.body.name ? req.body.name : '';
        if (!Validator.isEmpty(tempName)) {
          if (!Validator.isLength(tempName, { min: 1 })) {
            return res.status(402).json({
              message: 'Name field is required!',
            });
          }

          if (tempName.length > 50) {
            return res.status(401).json({
              message: 'Maximum 50 characters allowed in name field!',
            });
          }
        }

        // const tempNote = req.body.note ? req.body.note : '';
        // if (!Validator.isEmpty(tempNote)) {
        //   if (!Validator.isLength(tempNote, { min: 1 })) {
        //     return res.status(402).json({
        //       message: 'Note field is required!',
        //     });
        //   }

        //   if (tempNote.length > 240) {
        //     return res.status(401).json({
        //       message: 'Maximum 240 characters allowed in note field!',
        //     });
        //   }
        // }
        const tempDescription = req.body.description
          ? req.body.description
          : '';
        if (!Validator.isEmpty(tempDescription)) {
          if (!Validator.isLength(tempDescription, { min: 1 })) {
            return res.status(401).json({
              message: 'Description field is required!',
            });
          }

          if (tempDescription.length > 5000) {
            return res.status(401).json({
              message: 'Maximum 5000 characters allowed in description field!',
            });
          }
        }

        const description = req.body.description
          ? req.body.description
          : extCard[0].description;

        const name = req.body.name ? req.body.name : extCard[0].name;

        // const note = req.body.note ? req.body.note : extCard[0].note;

        const updated = await Card.findOneAndUpdate(
          { projectId: project[0]._id, slug: req.params.cardSlug },
          {
            $set: {
              name,
              description,
              // note,
            },
          },
          { new: true, useFindAndModify: false }
        );

        return res.status(200).json({
          message: 'Card updated successfully!',
        });
      }
      if (extCard[0].type === 'contact') {
        const tempName = req.body.name ? req.body.name : '';
        if (!Validator.isEmpty(tempName)) {
          if (!Validator.isLength(tempName, { min: 1 })) {
            return res.status(402).json({
              message: 'Name field is required!',
            });
          }

          if (tempName.length > 50) {
            return res.status(401).json({
              message: 'Maximum 50 characters allowed in name field!',
            });
          }
        }

        const tempTitle = req.body.title ? req.body.title : '';
        if (!Validator.isEmpty(tempTitle)) {
          if (!Validator.isLength(tempTitle, { min: 1 })) {
            return res.status(402).json({
              message: 'Title field is required!',
            });
          }

          if (tempTitle.length > 30) {
            return res.status(401).json({
              message: 'Maximum 30 characters allowed in title field!',
            });
          }
        }

        const tempPhone = req.body.phone ? req.body.phone : '';
        if (!Validator.isEmpty(tempPhone)) {
          if (!Validator.isLength(tempPhone, { min: 1 })) {
            return res.status(402).json({
              message: 'phone field is required!',
            });
          }

          if (tempPhone.length > 20) {
            return res.status(401).json({
              message: 'Maximum 20 characters allowed in phone field!',
            });
          }
        }

        // const templinkedin = req.body.linkedin ? req.body.linkedin : '';
        // if (!Validator.isEmpty(templinkedin)) {
        //   if (!Validator.isLength(templinkedin, { min: 1 })) {
        //     return res.status(402).json({
        //       message: 'linkedin field is required!',
        //     });
        //   }
        // }

        const tempEmail = req.body.email ? req.body.email : '';
        if (!Validator.isEmpty(tempEmail)) {
          if (!Validator.isLength(tempEmail, { min: 1 })) {
            return res.status(402).json({
              message: 'Email field is required!',
            });
          }

          if (tempEmail.length > 50) {
            return res.status(401).json({
              message: 'Maximum 50 characters allowed in Email field!',
            });
          }

          if (Validator.isLength(tempEmail, { min: 1, max: 50 })) {
            if (!Validator.isEmail(tempEmail)) {
              return res.status(402).json({
                message: 'Email is invalid!',
              });
            }
          }
        }

        const name = req.body.name ? req.body.name : extCard[0].name;
        const title = req.body.title ? req.body.title : extCard[0].title;
        const phone = req.body.phone ? req.body.phone : extCard[0].phone;
        const email = req.body.email ? req.body.email : extCard[0].email;
        const linkedin = req.body.linkedin
          ? req.body.linkedin
          : extCard[0].linkedin;

        const updated = await Card.findOneAndUpdate(
          { projectId: project[0]._id, slug: req.params.cardSlug },
          {
            $set: {
              name,
              title,
              phone,
              email,
              linkedin,
            },
          },
          { new: true, useFindAndModify: false }
        );

        if (fileArr.length > 0) {
          const deleteFilePath = path.resolve(
            `uploads/${extCard[0].contactImage?.split('/')[2]}`
          );

          await fs.unlink(deleteFilePath, function (err) {
            if (err) {
              return res.status(404).json({
                message: 'Could not found the file!',
              });
            }
          });

          const filePath = `/attach/${fileArr[0].name}`;
          await Card.findOneAndUpdate(
            { _id: updated._id },
            {
              $set: {
                contactImage: filePath,
              },
            },
            { new: true, useFindAndModify: false }
          );
          fileArr.pop();
        }

        return res.status(200).json({
          message: 'Card updated successfully!',
        });
      }
      if (extCard[0].type === 'file') {
        const tempName = req.body.name ? req.body.name : '';
        if (!Validator.isEmpty(tempName)) {
          if (!Validator.isLength(tempName, { min: 1 })) {
            return res.status(402).json({
              message: 'Name field is required!',
            });
          }

          if (tempName.length > 50) {
            return res.status(401).json({
              message: 'Maximum 50 characters allowed in name field!',
            });
          }
        }
        // const tempNote = req.body.note ? req.body.note : '';
        // if (!Validator.isEmpty(tempNote)) {
        //   if (!Validator.isLength(tempNote, { min: 1 })) {
        //     return res.status(402).json({
        //       message: 'Note field is required!',
        //     });
        //   }

        //   if (tempNote.length > 240) {
        //     return res.status(401).json({
        //       message: 'Maximum 240 characters allowed in note field!',
        //     });
        //   }
        // }

        const tempDescription = req.body.description
          ? req.body.description
          : '';
        if (!Validator.isEmpty(tempDescription)) {
          if (!Validator.isLength(tempDescription, { min: 1 })) {
            return res.status(401).json({
              message: 'Description field is required!',
            });
          }

          if (tempDescription.length > 5000) {
            return res.status(401).json({
              message: 'Maximum 5000 characters allowed in description field!',
            });
          }
        }

        const description = req.body.description
          ? req.body.description
          : extCard[0].description;

        const name = req.body.name ? req.body.name : extCard[0].name;

        // const note = req.body.note ? req.body.note : extCard[0].note;

        const updated = await Card.findOneAndUpdate(
          { projectId: project[0]._id, slug: req.params.cardSlug },
          {
            $set: {
              name,
              description,
              // note,
            },
          },
          { new: true, useFindAndModify: false }
        );

        if (fileArr.length > 0) {
          const deleteFilePath = path.resolve(
            `uploads/${extCard[0].file?.split('/')[2]}`
          );

          await fs.unlink(deleteFilePath, function (err) {
            if (err) {
              return res.status(404).json({
                message: 'Could not found the file!',
              });
            }
          });

          const filePath = `/attach/${fileArr[0].name}`;
          await Card.findOneAndUpdate(
            { _id: updated._id },
            {
              $set: {
                file: filePath,
                fileOrginalName: fileArr[0].fileOrginalName,
              },
            },
            { new: true, useFindAndModify: false }
          );
          fileArr.pop();
        }

        return res.status(200).json({
          message: 'Card updated successfully!',
        });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({
        message: 'Internal servere error!!',
      });
    }
  }
);

module.exports = router;
