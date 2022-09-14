const mongoose = require('mongoose');
const slug = require('slugify');

const Schema = mongoose.Schema;

const CardSchema = new Schema(
  {
    name: {
      type: String,
    },
    description: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ['link', 'card', 'file', 'contact', 'code'],
    },
    // note: {
    //   type: String,
    // },
    url: {
      type: String,
    },
    title: {
      type: String,
    },
    file: { type: String },
    fileOrginalName: { type: String },
    contactImage: { type: String },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    linkedin: {
      type: String,
    },
    scriptCode: {
      type: String,
    },

    slug: { type: String },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  },
  {
    timestamps: true,
  }
);

CardSchema.pre('save', async function (next) {
  if (!this.isModified('name')) {
    next(); // skip it
    return; // stop this function from running
  }
  this.slug = slug(this.name.toLowerCase());

  const cardWithSlug = await this.constructor.aggregate([
    {
      $match: {
        projectId: { $eq: this.projectId },
      },
    },
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

  if (cardWithSlug.length > 0) {
    let tempSlug = `${this.slug}-${cardWithSlug.length + 1}`;

    if (cardWithSlug[cardWithSlug.length - 1].slug.split('-').length > 1) {
      let slugCountArray =
        cardWithSlug[cardWithSlug.length - 1].slug.split('-');
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

CardSchema.index({ name: 'text' });

module.exports = mongoose.model('Card', CardSchema);
