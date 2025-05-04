import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { redis } from "../lib/redis.js";

// 1️⃣ Generate JWTs
const generateTokens = (userId) => ({
  accessToken: jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  }),
  refreshToken: jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  }),
});

// 2️⃣ Store refresh token in Redis for 7 days
const storeRefreshToken = (userId, token) =>
  redis.set(`refresh_token:${userId}`, token, "EX", 7 * 24 * 60 * 60);

// 3️⃣ Cookie settings for cross-site on Render
const COOKIE_OPTS = {
  httpOnly: true, // not accessible from JS
  secure: true, // HTTPS only
  sameSite: "none", // allow cross-site
  domain: ".onrender.com", // share across rocket-bay.* and backend.*
  path: "/",
};

const setTokens = (res, accessToken, refreshToken) => {
  res
    .cookie("accessToken", accessToken, {
      ...COOKIE_OPTS,
      maxAge: 15 * 60 * 1000, // 15m
    })
    .cookie("refreshToken", refreshToken, {
      ...COOKIE_OPTS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
    });
};

export const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (await User.exists({ email })) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({ name, email, password });

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setTokens(res, accessToken, refreshToken);

    res.status(201).json({ _id: user._1, name, email, role: user.role });
  } catch (err) {
    console.error("signup error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setTokens(res, accessToken, refreshToken);

    res.json({ _id: user._id, name: user.name, email, role: user.role });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const { userId } = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const stored = await redis.get(`refresh_token:${userId}`);
    if (stored !== token) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
    res.cookie("accessToken", accessToken, {
      ...COOKIE_OPTS,
      maxAge: 15 * 60 * 1000,
    });
    res.json({ message: "Access token refreshed" });
  } catch (err) {
    console.error("refreshToken error:", err);
    res.status(401).json({ message: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const { userId } = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      await redis.del(`refresh_token:${userId}`);
    }
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("logout error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getProfile = (req, res) => {
  // protectRoute already populated req.user
  res.json(req.user);
};
