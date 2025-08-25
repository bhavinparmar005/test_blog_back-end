const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "skillBlogImage",
    allowed_formats: ["jpeg", "png", "jpg"],
    transformation: [
      {
        quality: "auto", // Auto compression
        fetch_format: "auto", // Auto format (webp, etc.)
      },
    ],
  },
});

module.exports = storage;
