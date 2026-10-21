require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { promisify } = require("node:util");

const materialsRouter = require("./routes/materials");

const app = express();
const scrypt = promisify(crypto.scrypt);
const PORT = process.env.PORT || 5000;
const USERS_FILE = path.join(__dirname, "users.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

async function readUsers() {
  try {
    return JSON.parse(await fs.readFile(USERS_FILE, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
      return res.status(400).json({
        message: "Enter your name and a valid email. Passwords must be at least 8 characters."
      });
    }

    const users = await readUsers();

    if (users.some((user) => user.email === email)) {
      return res.status(409).json({
        message: "An account with that email already exists."
      });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = (await scrypt(password, salt, 64)).toString("hex");

    users.push({
      id: crypto.randomUUID(),
      name,
      email,
      salt,
      passwordHash
    });

    await writeUsers(users);
    return res.status(201).json({ message: "Account created. Please sign in." });
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(500).json({ message: "Could not create the account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const users = await readUsers();
    const user = users.find((item) => item.email === email);

    if (!user) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    const passwordHash = await scrypt(password, user.salt, 64);
    const savedHash = Buffer.from(user.passwordHash, "hex");

    if (
      passwordHash.length !== savedHash.length ||
      !crypto.timingSafeEqual(passwordHash, savedHash)
    ) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    return res.json({
      token: crypto.randomBytes(32).toString("hex"),
      user: { id: user.id, name: user.name, email: user.email }
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
    database: mongoose.connection.readyState === 1 ? "connected" : "not connected"
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

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      console.log("Materials database connected.");
    } catch (error) {
      console.error("Database connection failed:", error.message);
    }
  } else {
    console.warn("No MongoDB connection setting found in the existing .env file.");
  }

  app.listen(PORT, () => {
    console.log(`Second Brain API is available at http://localhost:${PORT}`);
  });
}

startServer();