const prisma = require('../lib/prisma');
const { requireFields, isPositiveNumber } = require('../utils/validation');

const profileInclude = { customerProfile: true, providerProfile: true };
async function getProfile(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId }, include: profileInclude });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser, profile: user.customerProfile || user.providerProfile });
}
async function updateProfile(req, res) {
  const { name, phone, address, preferredCity, experienceYears, isAvailable, bio, serviceCity } = req.body;
  const userData = {};
  if (name !== undefined) { if (!String(name).trim()) return res.status(400).json({ error: 'Name cannot be empty' }); userData.name = String(name).trim(); }
  if (phone !== undefined) userData.phone = phone || null;
  const data = Object.keys(userData).length ? { ...userData } : {};
  if (req.user.role === 'CUSTOMER') data.customerProfile = { upsert: { create: { address, preferredCity }, update: { ...(address !== undefined && { address }), ...(preferredCity !== undefined && { preferredCity }) } } };
  if (req.user.role === 'PROVIDER') {
    if (experienceYears !== undefined && (!Number.isInteger(Number(experienceYears)) || Number(experienceYears) < 0)) return res.status(400).json({ error: 'Experience years must be a non-negative integer' });
    data.providerProfile = { upsert: { create: { experienceYears: Number(experienceYears || 0), isAvailable: isAvailable ?? true, bio, serviceCity }, update: { ...(experienceYears !== undefined && { experienceYears: Number(experienceYears) }), ...(typeof isAvailable === 'boolean' && { isAvailable }), ...(bio !== undefined && { bio }), ...(serviceCity !== undefined && { serviceCity }) } } };
  }
  const user = await prisma.user.update({ where: { id: req.user.userId }, data, include: profileInclude });
  const { passwordHash, ...safeUser } = user;
  res.json({ message: 'Profile updated', user: safeUser, profile: user.customerProfile || user.providerProfile });
}
module.exports = { getProfile, updateProfile };
