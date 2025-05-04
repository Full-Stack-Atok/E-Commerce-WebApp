// backend/src/controllers/auth.controller.js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { redis } from "../lib/redis.js";

const signToken = (userId, secret, expiresIn) =>
  jwt.sign({ userId }, secret, { expiresIn });

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // must be HTTPS
  sameSite: "none", // allow cross-site
  domain: ".onrender.com", // share across rocket-bay.* and backend.*
  path: "/",
};

export const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (await User.exists({ email })) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({ name, email, password });

    const accessToken = signToken(
      user._id,
      process.env.ACCESS_TOKEN_SECRET,
      "15m"
    );
    const refreshToken = signToken(
      user._id,
      process.env.REFRESH_TOKEN_SECRET,
      "7d"
    );
    await redis.set(
      `refresh_token:${user._id}`,
      refreshToken,
      "EX",
      7 * 24 * 60 * 60
    );

    res
      .cookie("accessToken", accessToken, {
        ...COOKIE_OPTS,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...COOKIE_OPTS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(201)
      .json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
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
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const accessToken = signToken(
      user._id,
      process.env.ACCESS_TOKEN_SECRET,
      "15m"
    );
    const refreshToken = signToken(
      user._id,
      process.env.REFRESH_TOKEN_SECRET,
      "7d"
    );
    await redis.set(
      `refresh_token:${user._id}`,
      refreshToken,
      "EX",
      7 * 24 * 60 * 60
    );

    res
      .cookie("accessToken", accessToken, {
        ...COOKIE_OPTS,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...COOKIE_OPTS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const stored = await redis.get(`refresh_token:${decoded.userId}`);
    if (stored !== token) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = signToken(
      decoded.userId,
      process.env.ACCESS_TOKEN_SECRET,
      "15m"
    );
    res
      .cookie("accessToken", newAccessToken, {
        ...COOKIE_OPTS,
        maxAge: 15 * 60 * 1000,
      })
      .json({ message: "Access token refreshed" });
  } catch (err) {
    console.error("refreshToken error:", err);
    res.status(401).json({ message: "Could not refresh token" });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      await redis.del(`refresh_token:${decoded.userId}`);
    }
    res
      .clearCookie("accessToken", { domain: ".onrender.com", path: "/" })
      .clearCookie("refreshToken", { domain: ".onrender.com", path: "/" })
      .json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("logout error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getProfile = async (req, res) => {
  res.json(req.user);
};
