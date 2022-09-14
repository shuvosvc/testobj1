const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const TeamSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    url: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      default: null,
    },
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    siteName: {
      type: String,
    },

    teamMembers: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'User',
      },
    ],
    projects: [
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

module.exports = mongoose.model('Team', TeamSchema);
