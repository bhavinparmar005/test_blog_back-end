const schoolTbl = require("../models/school_schema");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

// total student and schools

module.exports.totalstudentandschools = async (req, res) => {
  try {
    const allSchools = await schoolTbl.find(); // fetch all schools

    let totalStudents = 0;

    // sum the student count from each school
    allSchools.forEach((school) => {
      totalStudents += Number(school.student || 0); // convert string to number if needed
    });

    res.status(200).json({
      totalStudents,
      totalSchools: allSchools.length,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add school controller
module.exports.addschool = async (req, res) => {
  try {
    const existingSchool = await schoolTbl.findOne({ email: req.body.email });
    if (existingSchool) {
      return res.status(400).json({
        success: false,
        message: "A school with this email already exists!",
      });
    }
    // 1️⃣ Generate a 6-digit password
    const generatedPassword = Math.floor(100000 + Math.random() * 900000);
    req.body.password = generatedPassword;

    // console.info(
    //   `[INFO] Generating password for new school: ${req.body.schoolname}`
    // );

    // 2️⃣ Setup email
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
      to: req.body.email,
      subject: "Your Account Credentials",
      html: `
       <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; color: #333;">
         <h2 style="color: #007a7a;">Your Account Credentials</h2>
           <p>Welcome to <strong style="color: #007a7a;">${req.body.schoolname}</strong> at Skill Will Win Blog!</p>
        <p>Your account has been successfully created. Here are your login details:</p>

  <div style="margin-top: 20px;">
    <p><strong style="color: #007a7a;">Email:</strong> ${req.body.email}</p>
    <p><strong style="color: #007a7a;">Password:</strong> 
      <span style="font-size: 18px; font-weight: bold; background-color: #e6fffa; padding: 5px 10px; border-radius: 6px; border: 1px solid #007a7a;">
        ${generatedPassword}
      </span>
    </p>
  </div>

  <p style="margin-top: 20px;">Keep this information secure. Do not share it with anyone.</p>
  <p style="color: #888;">If you did not create this account, please contact support immediately.</p>

  <hr style="margin: 30px 0;">
  <p style="font-size: 12px; color: #aaa;">© 2025 Skill Will Win Blog Inc. All rights reserved.</p>
</div>
             
             `,
    };

    // 3️⃣ Send email
    await transporter.sendMail(mailOptions);
    // console.info(
    //   `[SUCCESS] Email sent to ${req.body.email} for school ${req.body.schoolname}`
    // );

    // 4️⃣ Save to DB after successful email
    const newSchool = new schoolTbl(req.body);
    await newSchool.save();
    // console.info(
    //   `[SUCCESS] School data saved in database for ${req.body.schoolname}`
    // );

    res.status(200).json({
      message: "Email sent successfully and school added to database!",
      success: true,
    });
  } catch (err) {
    console.error(
      `[ERROR] Failed to send email or save school: ${err.message}`
    );
    res.status(500).json({
      message: "Failed to send email or save data",
      error: err.message,
    });
  }
};

// Edit school controller
module.exports.editschool = async (req, res) => {
  try {
    const schoolId = req.params.id; // ID of the school to update

    const updatedSchool = await schoolTbl.findByIdAndUpdate(schoolId, req.body);

    res.status(200).json({
      success: true,
      message: "School updated successfully ✅",
      data: updatedSchool,
    });
  } catch (error) {
    console.error(`[ERROR] Failed to update school: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to update school",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// delete school controller
module.exports.deleteschool = async (req, res) => {
  try {
    const id = req.params.id;

    await schoolTbl.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "School deleted successfully ✅",
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

// All data school controller
module.exports.allschool = async (req, res) => {
  try {
    const schools = await schoolTbl.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json({
      success: true,
      message: "All schools fetched successfully ✅",
      data: schools,
    });
  } catch (error) {
    console.error("❌ Error fetching schools:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

//  school login  controller
module.exports.schoolLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check request me email or password aya ya nahi
    if (!email || !password) {
      return res.status(400).json({ message: "Email and Password required" });
    }

    // DB se school find karo
    const school = await schoolTbl.findOne({ email });
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // Password check (agar hashed ho to bcrypt.compare use karo)
    if (school.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // JWT Token generate
    const token = jwt.sign(
      { id: school._id, email: school.email, role: "school" },
      JWT_SECRET,
      { expiresIn: "7h" } // token 7 day baad expire hoga
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      school, // optional: front-end ko details dene ke liye
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//  school foreget password  controller
module.exports.schoolForgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if school email exists
    const findschoolemail = await schoolTbl.findOne({ email });

    if (!findschoolemail) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address",
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save OTP & expiry in DB
    findschoolemail.resetOtp = otp;
    findschoolemail.resetOtpExpiry = Date.now() + 2.5 * 60 * 1000; // 2.5 min
    await findschoolemail.save();

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
          <p>Hello, <b>${findschoolemail.schoolname}</b></p>
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

    // ✅ Success response
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

//  school checkotp  controller
module.exports.checkotp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Email find karo
    const school = await schoolTbl.findOne({ email });
    if (!school) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    // OTP check karo
    if (!school.resetOtp || school.resetOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Expiry check karo
    if (school.resetOtpExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // ✅ OTP sahi hai
    // Ek baar use hone ke baad OTP clear karna best practice hai
    school.resetOtp = null;
    school.resetOtpExpiry = null;
    await school.save();

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

//  school update password  controller
module.exports.schoolPasswordUpdate = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    // ✅ school find
    const school = await schoolTbl.findOne({ email });
    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    // ✅ password directly update (⚠️ insecure)
    school.password = newPassword;
    school.resetOtp = null;
    school.resetOtpExpiry = null;
    await school.save();

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

//  school change password  controller
module.exports.schoolResetPassword = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const school = await schoolTbl.findById(decoded.id);

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    const { oldPassword, newPassword } = req.body;

    // Old password check
    if (school.password !== oldPassword) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update new password
    school.password = newPassword;
    await school.save();

    res.status(200).json({ message: "Password updated successfully ✅" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
