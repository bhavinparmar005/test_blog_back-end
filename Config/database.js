const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Database Connected Successfully");
  } catch (err) {
    console.error("❌ Database Connection Failed:");
    console.error("Error Message:", err.message);
    console.error("Error Stack:", err.stack);
  }
})();
