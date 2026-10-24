
import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "./auth.service.js";

import {
  validateLogin,
  validateRegistration,
} from "./auth.validation.js";

export async function register(req, res, next) {
  const validation = validateRegistration(req.body ?? {});

  if (validation.error) {
    return res.status(400).json({
      success: false,
      message: validation.error,
    });
  }

  try {
    const result = await registerUser(validation.data);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      ...result,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    return next(error);
  }
}

export async function login(req, res, next) {
  const validation = validateLogin(req.body ?? {});

  if (validation.error) {
    return res.status(400).json({
      success: false,
      message: validation.error,
    });
  }

  try {
    const result = await loginUser(validation.data);

    if (!result) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      ...result,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await getCurrentUser(req.user.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is unavailable.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(error);
  }
}