const express = require("express");
const mongoose = require("mongoose");

const compression = require("compression");
require("dotenv").config();
const passport = require("passport");
const logger = require("morgan");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const api = require("./routes");
const config = require("./config/keys");

const User = require("./models/user");

const { sendNotification } = require("./mail-templates/trialEnd");

const cron = require("node-cron");

const app = express();

// set cors origin
app.use(
  cors({
    // origin: process.env.DASHBOARD_URL,
    origin: "*",
  })
);
app.use(express.json());
app.use(compression());

app.use(express.urlencoded());

app.use(logger("dev"));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/v1", api);

// DB Config
const mongoURI = config.mongoURI;

// imgaes folder
fs.exists("uploads", function (exists) {
  if (!exists) {
    fs.mkdirSync("uploads");
  }
});

app.use(
  "/attach",

  express.static(__dirname + "/uploads")
);

//cornjob

cron.schedule("1 0 * * *", async () => {
  try {
    const trialEndedUsers = await User.aggregate([
      {
        $match: {
          trialSeason: { $eq: 1 },
        },
      },

      {
        $project: {
          name: 1,
          email: 1,
        },
      },
    ]);

    for (let i = 0; i < trialEndedUsers.length; i++) {
      await sendNotification(trialEndedUsers[i]);
    }

    await User.updateMany(
      {
        trialSeason: { $gt: 0 },
      },
      {
        $inc: { trialSeason: -1 },
      },
      { new: true, useFindAndModify: false, returnDocument: "after" }
    );
  } catch (err) {
    console.log(err);
  }
});

// Connect to MongoDB
mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Server static assets if in production
if (process.env.NODE_ENV === "production") {
  // Set static folder for client
  app.use(express.static("client/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

app.use(express.static(path.join(__dirname, "public")));

// set port
const port = config.port;
app.listen(port, () =>
  console.log(`Server running on port ~👌~ http://localhost:${port}`)
);
