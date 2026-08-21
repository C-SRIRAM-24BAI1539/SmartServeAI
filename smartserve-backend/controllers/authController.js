const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { emailPattern, requireFields } = require('../utils/validation');

const register = async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: 'Server authentication is not configured' });
    const { name, email, password, role, phone, address, preferredCity, experienceYears } = req.body;
    const missing = requireFields(req.body, ['name', 'email', 'password']);
    if (missing || !emailPattern.test(email) || password.length < 8) {
      return res.status(400).json({ error: 'Name, a valid email, and a password of at least 8 characters are required' });
    }
    if (role && !['CUSTOMER', 'PROVIDER'].includes(role)) return res.status(400).json({ error: 'Invalid registration role' });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        phone,
        role: role || 'CUSTOMER',
        ...(role === 'PROVIDER'
          ? { providerProfile: { create: { experienceYears: experienceYears || 0 } } }
          : { customerProfile: { create: { address, preferredCity } } }),
      },
      include: {
        customerProfile: true,
        providerProfile: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.customerProfile || user.providerProfile,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: 'Server authentication is not configured' });
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await prisma.user.findUnique({
      where: { email },
      include: { customerProfile: true, providerProfile: true },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.customerProfile || user.providerProfile,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

module.exports = {
  register,
  login,
};
