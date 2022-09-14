const Project = require('../models/project');
const Team = require('../models/team');
const User = require('../models/user');
const Card = require('../models/card');

const jwt = require('jsonwebtoken');
const slug = require('slugify');

const config = require('../config/keys');

exports.getProjects = async function (req, res) {
  try {
    const user = await User.find({ email: req.user.email });

    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exist! ',
      });
    }

    const team = await Team.find({ url: req.params.teamUrl })
      .populate('projects')
      .exec();

    if (team.length === 0) {
      return res.status(404).json({
        message: 'This team does not exist! ',
      });
    }

    const isMember = team[0].teamMembers.includes(req.user.id);

    if (!isMember) {
      return res.status(200).json({
        private: true,
      });
    }

    const string = req.params.search;
    if (string) {
      const filteredProjects = await Project.aggregate([
        { $match: { team: { $eq: team[0]._id } } },
        { $match: { name: { $regex: `${string}`, $options: 'i' } } },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            slug: 1,
            cards: 1,
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
        projects: filteredProjects,
      });
    } else {
      return res.status(200).json({
        projects: team[0].projects,
      });
    }
  } catch (err) {
    return res.status(200).json({
      projects: [],
    });
  }
};

exports.getProject = async function (req, res) {
  try {
    const siteNameUser = await User.find({ siteName: req.params.siteName });

    let team = [];
    if (siteNameUser.length > 0) {
      team = await Team.aggregate([
        { $match: { url: { $eq: req.params.url } } },
        { $match: { admin: { $eq: siteNameUser[0]._id } } },
      ]);
    }
    if (team.length === 0) {
      return res.status(404).json({
        message: 'This project does not exist! ',
      });
    }

    const project = await Project.aggregate([
      { $match: { slug: { $eq: req.params.projectSlug } } },
      { $match: { team: { $eq: team[0]._id } } },
    ]);

    if (project.length === 0) {
      return res.status(404).json({
        message: 'This project does not exist! ',
      });
    }

    const memberArray = await User.aggregate([
      { $match: { _id: { $in: team[0].teamMembers } } },
      {
        $project: {
          email: 1,
          image: 1,
          name: 1,
          _id: 1,
        },
      },
    ]);

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

      const isMember = team[0].teamMembers.some(
        (members) => members.toString() === req.user.id.toString()
      );

      if (!isMember) {
        return res.status(200).json({
          private: true,
        });
      } else {
        return res.status(200).json({
          project: project[0],
          memberArray,
          admin: team[0].admin,
          teamImage: team[0].image,
          siteName: team[0].siteName,
          teamName: team[0]?.name,
        });
      }
    } else {
      return res.status(200).json({
        project: project[0],
        memberArray,
        admin: team[0].admin,
        teamImage: team[0].image,
        siteName: team[0].siteName,
        teamName: team[0]?.name,
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: 'Internal server error! ',
    });
  }
};

exports.createProject = async function (req, res) {
  try {
    const { name, description, teamUrl } = req.body;

    const user = await User.find({ email: req.user.email });

    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exist! ',
      });
    }

    const team = await Team.find({ url: teamUrl });

    if (team.length === 0) {
      return res.status(404).json({
        message: 'This team does not exist! ',
      });
    }

    if (req.user.id.toString() !== team[0].admin.toString()) {
      return res.status(403).json({
        message: 'Only admin may create a project! ',
      });
    }

    const project = new Project({
      name,
      description,
      team: team[0]._id,
      creator: req.user.id,
    });

    await project.save();

    await Team.findOneAndUpdate(
      { _id: team[0]._id },
      { $push: { projects: project._id } },

      { new: true, useFindAndModify: false }
    );

    res.status(200).json({
      project,
      message: 'Project created successfully ! ',
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error! ' });
  }
};

exports.updateProject = async function (req, res) {
  try {
    const user = await User.find({ email: req.user.email });

    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exist! ',
      });
    }

    const project = await Project.find({ slug: req.params.projectSlug });

    if (project.length === 0) {
      return res.status(404).json({
        message: 'This project does not exist! ',
      });
    }

    const team = await Team.find({ _id: project[0].team });

    if (req.user.id.toString() !== team[0].admin.toString()) {
      return res.status(403).json({
        message: 'Only admin may create a project! ',
      });
    }

    const projectName = req.body.name ? req.body.name : project[0].name;
    const projectDescription = req.body.description
      ? req.body.description
      : project[0].description;
    const projectAccessibility =
      req.body.private !== undefined ? req.body.private : project[0].private;

    if (req.body.private !== undefined) {
      if (req.body.private !== true && req.body.private !== false) {
        return res.status(401).json({
          message: 'Private field must be a boolean',
        });
      }
    }

    let tempPrjSlug = project[0].slug;
    if (project[0].name !== projectName) {
      tempPrjSlug = slug(projectName.toLowerCase());

      const projectWithSlug = await Project.aggregate([
        {
          $match: {
            slug: { $regex: `${tempPrjSlug}`, $options: 'i' },
          },
        },
        {
          $project: {
            slug: 1,
            w: {
              $cond: [
                { $eq: [{ $substr: [{ $toLower: '$slug' }, 0, 1] }, 'r'] },
                1,
                0,
              ],
            },
          },
        },
        { $sort: { w: -1 } },
      ]);

      if (projectWithSlug.length > 0) {
        let tempSlug = `${tempPrjSlug}-${projectWithSlug.length + 1}`;

        if (
          projectWithSlug[projectWithSlug.length - 1].slug.split('-').length > 1
        ) {
          let slugCountArray =
            projectWithSlug[projectWithSlug.length - 1].slug.split('-');
          let slugCount =
            parseInt(slugCountArray[slugCountArray.length - 1]) + 1;

          if (slugCount) {
            tempSlug = `${tempPrjSlug}-${slugCount}`;
          } else {
            tempSlug = `${tempPrjSlug}-1`;
          }
        }
        tempPrjSlug = tempSlug;
      }
    }

    await Project.updateOne(
      { slug: req.params.projectSlug },
      {
        $set: {
          name: projectName,
          slug: tempPrjSlug,
          description: projectDescription,
          private: projectAccessibility,
        },
      },
      { new: true, useFindAndModify: false }
    );

    res.status(200).json({
      message: 'Project updated successfully',
      slug: tempPrjSlug,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error ! ',
    });
  }
};

exports.deleteProject = async function (req, res) {
  try {
    const user = await User.find({ email: req.user.email });

    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exist! ',
      });
    }

    const project = await Project.find({ slug: req.params.projectSlug });

    if (project.length === 0) {
      return res.status(404).json({
        message: 'This project does not exist! ',
      });
    }

    const team = await Team.find({ _id: project[0].team });

    if (req.user.id.toString() !== team[0].admin.toString()) {
      return res.status(403).json({
        message: 'Only admin may delete a project! ',
      });
    }
    await Project.deleteOne({ slug: req.params.projectSlug });

    await Team.findOneAndUpdate(
      { url: team[0].url },
      { $pull: { projects: { $eq: project[0].id } } },

      { new: true, useFindAndModify: false }
    );

    await Card.deleteMany({ projectId: project[0].id });

    res.status(200).json({
      message: 'Project deleted successfully',
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error ! ',
    });
  }
};
