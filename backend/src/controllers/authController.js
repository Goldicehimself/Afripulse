const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Profile = require("../models/Profile");

const register = async (req, res) => {
  try {
    const { name, email, password, handle } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password required." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already in use." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      handle: handle || `@${name.toLowerCase().replace(/\s+/g, "")}`,
    });

    await Profile.create({
      userId: created._id,
      name: created.name,
      handle: created.handle,
      bio: "",
      location: "",
      memberSince: new Date().toLocaleString("en-US", { month: "short", year: "numeric" }),
      followers: 0,
      following: 0,
      stats: {
        predictionPoints: 0,
        accuracyRate: 0,
        reactionsGiven: 0,
        dailyStreak: 0,
      },
      achievements: [],
    });

    return res.status(201).json({ message: "Account created." });
  } catch (err) {
    return res.status(500).json({ message: "Failed to register." });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body || {};
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({ message: "JWT_SECRET not configured." });
  }
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required." });
  }

  if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
    try {
      let adminUser = await User.findOne({ email: adminEmail.toLowerCase() });
      if (!adminUser) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        adminUser = await User.create({
          name: "Admin",
          email: adminEmail.toLowerCase(),
          passwordHash,
          handle: "@admin",
        });
      }
      const existingProfile = await Profile.findOne({ userId: adminUser._id });
      if (!existingProfile) {
        await Profile.create({
          userId: adminUser._id,
          name: adminUser.name,
          handle: adminUser.handle || "@admin",
          bio: "",
          location: "",
          memberSince: new Date().toLocaleString("en-US", { month: "short", year: "numeric" }),
          followers: 0,
          following: 0,
          stats: {
            predictionPoints: 0,
            accuracyRate: 0,
            reactionsGiven: 0,
            dailyStreak: 0,
          },
          achievements: [],
        });
      }

      const token = jwt.sign(
        { userId: adminUser._id, email: adminUser.email, name: adminUser.name, role: "admin" },
        secret,
        { expiresIn: "7d" }
      );
      return res.json({
        token,
        user: { id: adminUser._id, email: adminUser.email, name: adminUser.name, role: "admin" },
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to login." });
    }
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name, role: "user" },
      secret,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name, role: "user" },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to login." });
  }
};

module.exports = { register, login };
