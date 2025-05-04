// backend/src/controllers/auth.controller.js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { redis } from "../lib/redis.js";

// Generate JWT access & refresh tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

// Store the refresh token in Redis with 7-day TTL
const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  );
};

// Set HTTP-only, secure, cross-site cookies
const setCookies = (res, accessToken, refreshToken) => {
  // Host-only (backend) cookies. sameSite none allows cross-site.
  const cookieOpts = {
    httpOnly: true,
    secure: true, // must be HTTPS
    sameSite: "none", // allow cross-site
    path: "/",
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOpts,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieOpts,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    if (await User.exists({ email })) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({ name, email, password });

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("signup error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("login error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refresh = req.cookies.refreshToken;
    if (refresh) {
      const decoded = jwt.verify(refresh, process.env.REFRESH_TOKEN_SECRET);
      await redis.del(`refresh_token:${decoded.userId}`);
    }
    // Clear cookies on backend host
    res
      .clearCookie("accessToken", { path: "/" })
      .clearCookie("refreshToken", { path: "/" })
      .json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("logout error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refresh = req.cookies.refreshToken;
    if (!refresh) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(refresh, process.env.REFRESH_TOKEN_SECRET);
    const stored = await redis.get(`refresh_token:${decoded.userId}`);
    if (stored !== refresh) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    // Only reset the access token here
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });
    res.json({ message: "Access token refreshed" });
  } catch (error) {
    console.error("refreshToken error:", error);
    res.status(401).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  // protectRoute middleware must set req.user
  res.json(req.user);
};
