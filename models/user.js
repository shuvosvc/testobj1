const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    image: {
      type: String,
      default: null,
    },
    customerId: {
      type: String,
    },
    sourceId: {
      type: String,
      default: null,
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['member', 'guest'],
    },

    cardName: {
      type: String,
    },

    siteName: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
    },

    billing: {
      type: Object,
      default: null,
    },

    activeEmailOtp: {
      type: Number,
    },

    activeEmailOtpExpiry: {
      type: Number,
    },
    forgetEmailOtp: {
      type: String,
    },

    forgetEmailOtpExpiry: {
      type: Number,
    },

    activeStatus: {
      type: Boolean,
      default: false,
      required: true,
    },

    membership: {
      type: Boolean,
      default: false,
    },
    trialSeason: {
      type: Number,
      min: 0,
    },

    teams: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'Team',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', UserSchema);
