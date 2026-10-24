const prisma = require('../lib/prisma');
async function dashboard(req, res) { const [users, customers, providers, bookings, pendingBookings] = await Promise.all([prisma.user.count(), prisma.customerProfile.count(), prisma.providerProfile.count(), prisma.booking.count(), prisma.booking.count({ where: { status: 'PENDING' } })]); res.json({ metrics: { users, customers, providers, bookings, pendingBookings } }); }
async function users(req, res) { const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, customerProfile: true, providerProfile: true }, orderBy: { createdAt: 'desc' } }); res.json({ users }); }
module.exports = { dashboard, users };
