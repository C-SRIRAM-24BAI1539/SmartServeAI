
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
};

function createToken(user) {
  return jwt.sign(
    { role: user.role },
    env.jwtSecret,
    {
      subject: user.id,
      expiresIn: env.jwtExpiresIn,
      algorithm: "HS256",
    },
  );
}

export async function registerUser(data) {
  const passwordHash = await bcrypt.hash(data.password, 12);

  const userData = {
    name: data.name,
    email: data.email,
    passwordHash,
    role: data.role,
  };

  if (data.role === "PROVIDER") {
    userData.providerProfile = {
      create: {
        businessName: data.businessName,
      },
    };
  }

  const user = await prisma.user.create({
    data: userData,
    select: publicUserSelect,
  });

  return {
    user,
    token: createToken(user),
  };
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return null;
  }

  if (!user.isActive) {
    return null;
  }

  const { passwordHash, ...publicUser } = user;

  return {
    user: publicUser,
    token: createToken(user),
  };
}

export async function getCurrentUser(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
}