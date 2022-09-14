const User = require('../models/user');
const Team = require('../models/team');
const Project = require('../models/project');
const Card = require('../models/card');

exports.checkOutUrl = async function (req, res) {
  try {
    const string = req.params.string;

    if (string) {
      // const  url = req.params.string.toLowerCase()
      const user = await User.findOne({
        siteName: string.toLowerCase(),
      });
      if (user) {
        return res.status(200).json({
          isUrl: true,
        });
      } else {
        return res.status(200).json({
          isUrl: false,
        });
      }
    } else {
      return res.status(200).json({
        isUrl: false,
      });
    }
  } catch (err) {
    return res.status(200).json({
      isUrl: false,
    });
  }
};

exports.allTeams = async function (req, res) {
  try {
    const user = await User.find({ email: req.user.email })
      .populate('teams')
      .exec();

    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exist! ',
      });
    }
    if (user[0].membership === false && user[0].trialSeason === 0) {
      return res.status(403).json({
        message: 'Accesed denied! ',
      });
    }
    const string = req.params.search;

    if (string !== undefined) {
      const teams = await Team.aggregate([
        { $match: { teamMembers: { $eq: req.user._id } } },
        { $match: { name: { $regex: `${string}`, $options: 'i' } } },
        {
          $project: {
            _id: 1,
            name: 1,
            url: 1,
            image: 1,
            projects: 1,
            siteName: 1,
            description: 1,
            teamMembers: 1, // this  line is must for lookup to work
            w: {
              $cond: [
                { $eq: [{ $substr: [{ $toLower: '$name' }, 0, 1] }, 'r'] },
                1,
                0,
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'teamMembers',
            foreignField: '_id',

            pipeline: [{ $project: { _id: 1, email: 1, image: 1 } }],

            as: 'teamMembers',
          },
        },
        { $sort: { w: -1 } },
      ]).limit(20);

      return res.status(200).json({
        teams,
      });
    } else {
      const teams = await Team.find({ teamMembers: req.user._id })
        .populate('teamMembers', '_id email image')
        .exec();

      return res.status(200).json({
        teams: teams,
      });
    }
  } catch (err) {
    return res.status(200).json({
      teams: [],
    });
  }
};

exports.ownTeams = async function (req, res) {
  try {
    const user = await User.find({ email: req.user.email });

    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exist! ',
      });
    }
    if (user[0].membership === false && user[0].trialSeason === 0) {
      return res.status(403).json({
        message: 'Accesed denied! ',
      });
    }
    const string = req.params.search;
    if (string) {
      const teams = await Team.aggregate([
        { $match: { admin: { $eq: req.user._id } } },
        { $match: { name: { $regex: `${string}`, $options: 'i' } } },
        {
          $project: {
            _id: 1,
            name: 1,
            url: 1,
            image: 1,
            description: 1,
            projects: 1,
            siteName: 1,
            teamMembers: 1, // this  line is must for lookup to work
            w: {
              $cond: [
                { $eq: [{ $substr: [{ $toLower: '$name' }, 0, 1] }, 'r'] },
                1,
                0,
              ],
            },
          },
        },

        {
          $lookup: {
            from: 'users',

            localField: 'teamMembers',
            foreignField: '_id',

            pipeline: [{ $project: { _id: 1, email: 1, image: 1 } }],

            as: 'teamMembers',
          },
        },

        { $sort: { w: -1 } },
      ]).limit(20);

      return res.status(200).json({
        teams,
      });
    } else {
      const teams = await Team.find({ admin: req.user.id })
        .populate('teamMembers', '_id email image')
        .exec();

      return res.status(200).json({
        teams: teams,
      });
    }
  } catch (err) {
    return res.status(200).json({
      teams: [],
    });
  }
};

exports.sharedTeams = async function (req, res) {
  try {
    const user = await User.find({ email: req.user.email });

    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exist! ',
      });
    }

    const string = req.params.search;
    if (string) {
      const teams = await Team.aggregate([
        { $match: { teamMembers: { $eq: req.user._id } } },
        { $match: { admin: { $ne: req.user._id } } },
        { $match: { name: { $regex: `${string}`, $options: 'i' } } },
        {
          $project: {
            _id: 1,
            name: 1,
            url: 1,
            image: 1,
            projects: 1,
            description: 1,
            siteName: 1,
            teamMembers: 1, // this  line is must for lookup to work
            w: {
              $cond: [
                { $eq: [{ $substr: [{ $toLower: '$name' }, 0, 1] }, 'r'] },
                1,
                0,
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'users',

            localField: 'teamMembers',
            foreignField: '_id',

            pipeline: [{ $project: { _id: 1, email: 1, image: 1 } }],

            as: 'teamMembers',
          },
        },
        { $sort: { w: -1 } },
      ]).limit(20);

      return res.status(200).json({
        teams,
      });
    } else {
      const teams = await Team.find({
        teamMembers: req.user.id,
        admin: { $ne: req.user.id },
      })
        .populate('teamMembers', '_id email image')
        .exec();

      return res.status(200).json({
        teams: teams,
      });
    }
  } catch (err) {
    return res.status(200).json({
      teams: [],
    });
  }
};

exports.teamsearch = async function (req, res) {
  try {
    const user = await User.find({ email: req.user.email });

    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exist! ',
      });
    }
    const name = req.params.name;

    if (name) {
      if (user[0].membership === false && user[0].trialSeason === 0) {
        const teams = await Team.aggregate([
          { $match: { teamMembers: { $eq: req.user._id } } },
          { $match: { admin: { $ne: req.user._id } } },
          { $match: { name: { $regex: `${name}`, $options: 'i' } } },

          {
            $project: {
              _id: 1,
              name: 1,
              url: 1,
              image: 1,
              projects: 1,
              description: 1,
              siteName: 1,
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
          teams: teams,
        });
      } else {
        const teams = await Team.aggregate([
          { $match: { teamMembers: { $eq: req.user._id } } },
          { $match: { name: { $regex: `${name}`, $options: 'i' } } },
          {
            $project: {
              _id: 1,
              name: 1,
              url: 1,
              image: 1,
              projects: 1,
              description: 1,
              siteName: 1,
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
          teams,
        });
      }
    } else {
      if (user[0].membership === false && user[0].trialSeason === 0) {
        const teams = await Team.aggregate([
          { $match: { teamMembers: { $eq: req.user._id } } },
          { $match: { admin: { $ne: req.user._id } } },

          {
            $project: {
              _id: 1,
              name: 1,
              url: 1,
              image: 1,
              projects: 1,
              description: 1,
              siteName: 1,
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
          teams: teams,
        });
      } else {
        const teams = await Team.aggregate([
          { $match: { teamMembers: { $eq: req.user._id } } },

          {
            $project: {
              _id: 1,
              name: 1,
              url: 1,
              image: 1,
              projects: 1,
              description: 1,
              siteName: 1,
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
          teams,
        });
      }
    }
  } catch (err) {
    return res.status(200).json({
      teams: [],
    });
  }
};

exports.getTeam = async function (req, res) {
  try {
    const user = await User.find({ email: req.user.email });

    if (user.length === 0) {
      return res.status(404).json({
        message: 'User does not exist! ',
      });
    }

    const team = await Team.find({ url: req.params.url })
      .populate('teamMembers')
      .exec();

    let updatedTeamMembers = [];
    team[0].teamMembers.map((member) => {
      const memberInfo = {
        _id: member._id,
        image: member.image,
        name: member.name,
        email: member.email,
      };
      updatedTeamMembers.push(memberInfo);
    });
    const temp = team[0];

    const updatedTeam = {
      private: temp.private,
      description: temp.description,
      image: temp.image,
      teamMembers: updatedTeamMembers,
      projects: temp.projects,
      _id: temp._id,
      name: temp.name,
      url: temp.url,
      admin: temp.admin,
      createdAt: temp.createdAt,
      updatedAt: temp.updatedAt,
      siteName: temp.siteName,
      __v: temp.__v,
    };

    if (team.length === 0 || temp.siteName !== req.params.siteName) {
      return res.status(404).json({
        message: 'This team does not exist! ',
      });
    }

    const exTeam = await Team.find({
      url: req.params.url,
      teamMembers: req.user.id,
    });
    if (exTeam.length === 0) {
      return res.status(200).json({
        private: true,
      });
    }

    res.status(200).json({
      team: updatedTeam,
    });
  } catch (err) {
    res.status(500).send({ message: 'Internal server error' });
  }
};

exports.members = async function (req, res) {
  try {
    const team = await Team.find({ url: req.params.url })
      .populate('teamMembers')
      .exec();

    if (team.length === 0) {
      return res.status(400).json({
        message: 'This team does not exist! ',
      });
    }

    res.status(200).json({
      teamMembers: team[0].teamMembers,
    });
  } catch (err) {
    res.status(500).send({ message: 'Internal server error' });
  }
};

exports.checkUrl = async function (req, res, next) {
  try {
    const { url } = req.body;

    const exeUrl = await Team.findOne({ url });

    if (exeUrl) {
      return res.status(403).json({
        message: 'This team url is already taken!',
      });
    }
    next();
  } catch (err) {
    res.status(500).send({ message: 'Internal server error!' });
  }
};

exports.deleteTeam = async function (req, res) {
  try {
    const team = await Team.find({ url: req.params.url });

    if (team.length === 0) {
      return res.status(404).json({
        message: 'This team does not exist! ',
      });
    }

    if (team[0].admin != req.user.id) {
      return res.status(403).json({
        message: 'Only admin may delete the team! ',
      });
    }

    await User.updateMany(
      { _id: { $in: team[0].teamMembers } },
      { $pull: { teams: team[0]._id } }
    );

    await Card.deleteMany({ projectId: { $in: team[0].projects } });
    await Project.deleteMany({ _id: { $in: team[0].projects } });
    await Team.deleteOne({ url: req.params.url });

    res.status(200).json({
      message: 'Team deleted successfully',
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error!',
    });
  }
};
