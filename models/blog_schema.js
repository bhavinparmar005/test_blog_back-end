const mongoose = require("mongoose");

const blogData = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  shortDescription: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
  },
  month: {
    type: String,
    required: false,
  },
});

const blogschema = mongoose.model("blog", blogData);

module.exports = blogschema;
