// backend/controllers/auth.controller.js
import jwt from "jsonwebtoken";
import { promisify } from "util";
import User from "../models/User.js";

// Helper to sign a JWT
const signToken = (id, secret, expiresIn) =>
  jwt.sign({ id }, secret, { expiresIn });

// Cookie options shared by signup/login/refresh
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // only over HTTPS in prod
  sameSite: "none", // allow cross-site
  path: "/", // root path
};

// ─── SIGNUP ─────────────────────────────────────────────────────────────────
export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.create({ email, password });

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

    res
      .cookie("accessToken", accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      }) // 15m
      .cookie("refreshToken", refreshToken, {
        ...COOKIE_OPTIONS,
        path: "/api/auth/refresh-token",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }) // 7d
      .status(201)
      .json({ email: user.email });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ─── LOGIN ──────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
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

    res
      .cookie("accessToken", accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...COOKIE_OPTIONS,
        path: "/api/auth/refresh-token",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ email: user.email });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// ─── LOGOUT ─────────────────────────────────────────────────────────────────
export const logout = (_req, res) => {
  res
    .clearCookie("accessToken", { path: "/" })
    .clearCookie("refreshToken", { path: "/api/auth/refresh-token" })
    .json({ message: "Logged out" });
};

// ─── REFRESH TOKEN ───────────────────────────────────────────────────────────
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = await promisify(jwt.verify)(
      token,
      process.env.REFRESH_TOKEN_SECRET
    );
    const newAccessToken = signToken(
      decoded.id,
      process.env.ACCESS_TOKEN_SECRET,
      "15m"
    );

    res
      .cookie("accessToken", newAccessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      })
      .json({ message: "Access token refreshed" });
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

// ─── PROFILE ─────────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  // protectRoute middleware already verified req.user
  const { email, role } = req.user;
  res.json({ email, role });
};
