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

app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found!" });
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error!" });
});

app.listen(process.env.PORT, (err) => {
  if (err) {
    console.log(err);
  }

  console.log(`server start at port ${process.env.PORT}`);
});
