const express = require("express");
const helmet = require("helmet");
const dotenv = require("dotenv").config();
const cors = require("cors");
const database = require("./Config/database");

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use("/", require("./Router/AllRouter"));
app.use((err, req, res, next) => {
  console.error(err.stack); // log actual error
  res.status(500).json({ message: err.message || "Server error" });
});

app.listen(process.env.PORT, (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`server start at port ${process.env.PORT}`);
});

module.exports = app;