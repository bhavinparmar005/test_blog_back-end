const admintbl = require("../models/admin_schema");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// add admin
module.exports.addadmin = async (req, res) => {
  try {
    const admin = new admintbl(req.body);
    await admin.save();

    res.status(201).json({
      success: true,
      message: "Admin added successfully ✅",
      data: admin,
    });
  } catch (error) {
    console.error("❌ Error adding admin:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to add admin ❌",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// login admin and send token
module.exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check request me email or password aya ya nahi
    if (!email || !password) {
      return res.status(400).json({ message: "Email and Password required" });
    }

    // DB se school find karo
    const findAdmin = await admintbl.findOne({ email });
    if (!findAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    // Password check
    if (findAdmin.password !== password) {
      return res.status(401).json({ message: "Password not match !!!" });
    }
    // JWT Token generate
    const adminToken = jwt.sign(
      { id: findAdmin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // 7day token baad expire hoga
    );

    return res.status(200).json({
      message: "Login successful",
      adminToken,
      AdminName: findAdmin.name, // optional: front-end ko details dene ke liye
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.adminForgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const findadminemail = await admintbl.findOne({ email });

    if (!findadminemail) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address",
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save OTP & expiry in DB
    findadminemail.resetOtp = otp;
    findadminemail.resetOtpExpiry = Date.now() + 2.5 * 60 * 1000; // 2.5 min
    await findadminemail.save();

    // Nodemailer setup
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🔐 OTP for Forget Password",
      text: `Your OTP for Forget password is ${otp}`, // Fallback
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; color: #333;">
          <h2 style="color: #007a7a;">Forget Password Request</h2>
          <p>Hello, <b>${findadminemail.name}</b></p>
          <p>You recently requested to Forget your password. Use the OTP below to proceed:</p>
          
          <div style="font-size: 24px; font-weight: bold; background-color: #086885; padding: 10px 20px; display: inline-block; border-radius: 8px; color: #ffffff; border: 2px dashed #086885;">
            ${otp}
          </div>

          <p style="margin-top: 20px;">This OTP is valid for 2.5 minutes. Do not share it with anyone.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>

          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">© 2025 Skill Will Win Blog Inc. All rights reserved.</p>
        </div>
      `,
    };
    // Send OTP email
    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while sending OTP. Please try again later.",
      error: error.message,
    });
  }
};

module.exports.admincheckotp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Email find karo
    const adminEmail = await admintbl.findOne({ email });
    if (!adminEmail) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    // OTP check karo
    if (!adminEmail.resetOtp || adminEmail.resetOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Expiry check karo
    if (adminEmail.resetOtpExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }
    // ✅ OTP sahi hai
    // Ek baar use hone ke baad OTP clear karna best practice hai
    adminEmail.resetOtp = null;
    adminEmail.resetOtpExpiry = null;
    await adminEmail.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can reset your password now.",
    });
  } catch (error) {
    console.error("Check OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while verifying OTP",
      error: error.message,
    });
  }
};

module.exports.adminPasswordUpdate = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    // ✅ admin find
    const adminfind = await admintbl.findOne({ email });
    if (!adminfind) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // ✅ password directly update
    adminfind.password = newPassword;
    adminfind.resetOtp = null;
    adminfind.resetOtpExpiry = null;
    await adminfind.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
    
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// admin change password
module.exports.adminResetPassword = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const findadmin = await admintbl.findById(decoded.id);

    if (!findadmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const { oldPassword, newPassword } = req.body;

    // 🔹 Check current password
    if (findadmin.password !== oldPassword) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect ❌" });
    }

    // 🔹 Update new password
    findadmin.password = newPassword;
    await findadmin.save();

    return res.status(200).json({
      message: "Password updated successfully ✅",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
