const blogTbl = require("../models/blog_schema");
const cloudinary = require("cloudinary").v2;

module.exports.addblog = async (req, res) => {
  try {
    const { category, title, description, shortDescription } = req.body;
    let image = "";

    if (req.file) {
      image = {
        url: req.file.path,
        public_id: req.file.filename,
      };
    }

    // ✅ Set month only if category is "એક્ટિવિટી કેલેન્ડર"
    let month = undefined;
    if (category === "શાળા એક્ટિવિટી કેલેન્ડર") {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      month = monthNames[new Date().getMonth()];
    }

    const finalBlogData = {
      category,
      title,
      description,
      shortDescription,
      image,
      month,
    };

    const Admin = new blogTbl(finalBlogData);
    await Admin.save();

    res.status(201).json({
      success: true,
      message: "Blog created successfully ✅",
      data: Admin,
    });
  } catch (err) {
    console.error("❌ Error in addblog:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

module.exports.updatablog = async (req, res) => {
  try {
    const id = req.params.id;
    const { category, title, description, shortDescription } = req.body;

    // Find existing blog first
    const existingBlog = await blogTbl.findById(id);
    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found ❌",
      });
    }

    // Prepare update data
    let updateData = {
      category,
      title,
      description,
      shortDescription,
      image: existingBlog.image, // default to existing image
    };

    // ✅ Add month if category is "એક્ટિવિટી કેલેન્ડર"
    if (category === "એક્ટિવિટી કેલેન્ડર") {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const now = new Date();
      updateData.month = monthNames[now.getMonth()];
    } else {
      updateData.month = undefined; // clear month for other categories
    }

    // If new image is uploaded, replace it
    if (req.file) {
      const newImage = {
        url: req.file.path,
        public_id: req.file.filename,
      };

      updateData.image = newImage;

      // Delete old image from Cloudinary if exists
      if (existingBlog.image?.public_id) {
        await cloudinary.uploader.destroy(existingBlog.image.public_id);
      }
    }

    // Update the blog
    const updatedBlog = await blogTbl.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Blog updated successfully ✅",
      data: updatedBlog,
    });
  } catch (error) {
    console.error("❌ Error in updatablog:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports.allblog = async (req, res) => {
  try {
    const blogs = await blogTbl.find().sort({ createdAt: -1 }); // latest first

    res.status(200).json({
      success: true,
      message: "All blogs fetched successfully ✅",
      data: blogs,
    });
  } catch (error) {
    console.error("❌ Error fetching blogs:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


module.exports.deleteblog = async (req, res) => {
  try {
    const id = req.params.id;

    // Find the blog first
    const blog = await blogTbl.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found ❌",
      });
    }

    // Delete image from Cloudinary if exists
    if (blog.image?.public_id) {
      await cloudinary.uploader.destroy(blog.image.public_id);
    }

    // Delete the blog from DB
    await blogTbl.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully ✅",
    });
  } catch (error) {
    console.error("❌ Error deleting blog:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports.startServer = (req, res) => {
  res.status(200).json({ message: "🚀 Server is running", status: "success" });
};
