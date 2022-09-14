const mongoose = require('mongoose');
const slug = require('slugify');

const { Schema } = mongoose;

const ProjectSchema = new Schema(
  {
    name: {
      type: String,
    },
    creator: {
      type: String,
    },
    description: {
      type: String,
      default: null,
    },
    private: {
      type: Boolean,
      default: true,
    },
    slug: { type: String },

    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },

    cards: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'Project',
      },
    ],
  },
  {
    timestamps: true,
  }
);

ProjectSchema.pre('save', async function (next) {
  if (!this.isModified('name')) {
    next(); // skip it
    return; // stop this function from running
  }
  this.slug = slug(this.name.toLowerCase());

  const projectWithSlug = await this.constructor.aggregate([
    {
      $match: {
        slug: { $regex: `${this.slug}`, $options: 'i' },
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
    let tempSlug = `${this.slug}-${projectWithSlug.length + 1}`;

    if (
      projectWithSlug[projectWithSlug.length - 1].slug.split('-').length > 1
    ) {
      let slugCountArray =
        projectWithSlug[projectWithSlug.length - 1].slug.split('-');
      let slugCount = parseInt(slugCountArray[slugCountArray.length - 1]) + 1;

      if (slugCount) {
        tempSlug = `${this.slug}-${slugCount}`;
      } else {
        tempSlug = `${this.slug}-1`;
      }
    }
    this.slug = tempSlug;
  }

  next();
});

ProjectSchema.index({ name: 'text' });
module.exports = mongoose.model('Project', ProjectSchema);
