const mongoose = require("mongoose");

const schoolData = new mongoose.Schema({
  schoolname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // email unique rakhna best practice hai
  },
  phone: {
    type: String,
    required: true,
  },
  student: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },

  // 👇 New fields for Forgot Password
  resetOtp: {
    type: String,
    default: null,
  },
  resetOtpExpiry: {
    type: Date,
    default: null,
  },
});

const schoolSchema = mongoose.model("school", schoolData);

module.exports = schoolSchema;
