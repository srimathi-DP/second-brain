require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { promisify } = require("node:util");

const User = require("./models/user");
const materialsRouter = require("./routes/materials");

const app = express();
const scrypt = promisify(crypto.scrypt);
const PORT = process.env.PORT || 5000;
const USERS_FILE = path.join(__dirname, "users.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin include health checks and local tools.
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  })
);

app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

function hashPassword(password) {
  return scrypt(password, crypto.randomBytes(16).toString("hex"), 64);
}

async function makePasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)).toString("hex");
  return `${salt}:${hash}`;
}

async function importOldUsers() {
  let oldUsers;

  try {
    oldUsers = JSON.parse(await fs.readFile(USERS_FILE, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }

  if (!Array.isArray(oldUsers)) return;

  let imported = 0;

  for (const oldUser of oldUsers) {
    const email = String(oldUser.email || "").trim().toLowerCase();
    if (!email) continue;

    // Skip accounts that are already in MongoDB.
    if (await User.exists({ email })) continue;

    // Preserve the old scrypt password hash without storing the original password.
    const passwordRecord =
      oldUser.password ||
      (oldUser.salt && oldUser.passwordHash
        ? `${oldUser.salt}:${oldUser.passwordHash}`
        : "");

    if (!passwordRecord || !oldUser.name) continue;

    try {
      await User.create({
        userId: oldUser.userId || oldUser.id || crypto.randomUUID(),
        name: oldUser.name,
        email,
        password: passwordRecord,
        createdAt: oldUser.createdAt || new Date(),
      });
      imported += 1;
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }

  if (imported > 0) {
    console.log(`Imported ${imported} existing account(s) into MongoDB.`);
  }
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
      return res.status(400).json({
        message:
          "Enter your name and a valid email. Passwords must be at least 8 characters.",
      });
    }

    const existingUser = await User.exists({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with that email already exists.",
      });
    }

    const user = await User.create({
      userId: crypto.randomUUID(),
      name,
      email,
      password: await makePasswordRecord(password),
    });

    return res.status(201).json({
      message: "Account created. Please sign in.",
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with that email already exists.",
      });
    }

    console.error("Registration error:", error.message);
    return res.status(500).json({ message: "Could not create the account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Email or password is incorrect.",
      });
    }

    const [salt, savedHashHex] = String(user.password || "").split(":");
    if (!salt || !savedHashHex) {
      return res.status(401).json({
        message: "Email or password is incorrect.",
      });
    }

    const savedHash = Buffer.from(savedHashHex, "hex");
    const submittedHash = await scrypt(password, salt, 64);

    if (
      submittedHash.length !== savedHash.length ||
      !crypto.timingSafeEqual(submittedHash, savedHash)
    ) {
      return res.status(401).json({
        message: "Email or password is incorrect.",
      });
    }

    return res.json({
      token: crypto.randomBytes(32).toString("hex"),
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Sign-in error:", error.message);
    return res.status(500).json({ message: "Could not sign in." });
  }
});

app.use("/api/materials", materialsRouter);

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    database: mongoose.connection.readyState === 1 ? "connected" : "not connected",
  });
});

app.use((error, req, res, next) => {
  console.error("Server error:", error.message);
  res.status(500).json({ message: "The server encountered an error." });
});

async function startServer() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGO_URL;

  if (!mongoUri) {
    throw new Error("Add your MongoDB connection string to the server environment.");
  }

  await mongoose.connect(mongoUri);
  console.log("Materials and account database connected.");

  await importOldUsers();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Second Brain API is listening on port ${PORT}.`);
  });
}

startServer().catch((error) => {
  console.error("Could not start Second Brain:", error.message);
  process.exit(1);
});