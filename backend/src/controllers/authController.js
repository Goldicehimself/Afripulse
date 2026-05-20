const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { defaultProfileStats } = require("../utils/dbShape");

const register = async (req, res) => {
  try {
    const { name, email, password, handle } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password required." });
    }

    const normalizedEmail = email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ message: "Email already in use." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: {
      name,
      email: normalizedEmail,
      passwordHash,
      handle: handle || `@${name.toLowerCase().replace(/\s+/g, "")}`,
      },
    });

    await prisma.profile.create({
      data: {
      userId: created.id,
      name: created.name,
      handle: created.handle,
      bio: "",
      location: "",
      memberSince: new Date().toLocaleString("en-US", { month: "short", year: "numeric" }),
      followers: 0,
      following: 0,
      stats: {
        ...defaultProfileStats(),
      },
      achievements: [],
      },
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
      const normalizedAdminEmail = adminEmail.toLowerCase();
      let adminUser = await prisma.user.findUnique({ where: { email: normalizedAdminEmail } });
      if (!adminUser) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        adminUser = await prisma.user.create({
          data: {
          name: "Admin",
          email: normalizedAdminEmail,
          passwordHash,
          handle: "@admin",
          },
        });
      }
      const existingProfile = await prisma.profile.findUnique({ where: { userId: adminUser.id } });
      if (!existingProfile) {
        await prisma.profile.create({
          data: {
          userId: adminUser.id,
          name: adminUser.name,
          handle: adminUser.handle || "@admin",
          bio: "",
          location: "",
          memberSince: new Date().toLocaleString("en-US", { month: "short", year: "numeric" }),
          followers: 0,
          following: 0,
          stats: {
            ...defaultProfileStats(),
          },
          achievements: [],
          },
        });
      }

      const token = jwt.sign(
        { userId: adminUser.id, email: adminUser.email, name: adminUser.name, role: "admin" },
        secret,
        { expiresIn: "7d" }
      );
      return res.json({
        token,
        user: { id: adminUser.id, email: adminUser.email, name: adminUser.name, role: "admin" },
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to login." });
    }
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, role: "user" },
      secret,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: "user" },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to login." });
  }
};

module.exports = { register, login };
