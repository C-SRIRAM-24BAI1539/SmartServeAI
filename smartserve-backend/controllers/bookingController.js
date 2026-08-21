const prisma = require('../lib/prisma');
const { requireFields, isDate } = require('../utils/validation');
const include = { customer: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } }, provider: { include: { user: { select: { id: true, name: true, phone: true } } } }, service: { include: { category: true } }, review: true };
const transitions = { PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'], ACCEPTED: ['IN_PROGRESS', 'CANCELLED'], IN_PROGRESS: ['COMPLETED'], REJECTED: [], CANCELLED: [], COMPLETED: [] };
async function currentProfile(userId, role) { return role === 'CUSTOMER' ? prisma.customerProfile.findUnique({ where: { userId } }) : prisma.providerProfile.findUnique({ where: { userId } }); }
async function create(req, res) {
  const missing = requireFields(req.body, ['serviceId', 'rawIssueDescription', 'bookingDate']);
  if (missing || !isDate(req.body.bookingDate) || String(req.body.rawIssueDescription).trim().length < 10) return res.status(400).json({ error: 'Service, valid booking date, and issue description of at least 10 characters are required' });
  const customer = await currentProfile(req.user.userId, 'CUSTOMER');
  const service = await prisma.serviceOffered.findUnique({ where: { id: req.body.serviceId }, include: { provider: true } });
  if (!customer) return res.status(404).json({ error: 'Customer profile not found' });
  if (!service || !service.provider.isAvailable) return res.status(400).json({ error: 'Selected service is unavailable' });
  const booking = await prisma.booking.create({ data: { customerId: customer.id, providerId: service.providerId, serviceId: service.id, rawIssueDescription: req.body.rawIssueDescription.trim(), bookingDate: new Date(req.body.bookingDate), scheduledTime: req.body.scheduledTime || null }, include });
  res.status(201).json({ booking });
}
async function list(req, res) {
  let where = {};
  if (req.user.role === 'CUSTOMER') { const p = await currentProfile(req.user.userId, 'CUSTOMER'); where.customerId = p?.id || '__none__'; }
  if (req.user.role === 'PROVIDER') { const p = await currentProfile(req.user.userId, 'PROVIDER'); where.providerId = p?.id || '__none__'; }
  if (req.query.status) where.status = req.query.status;
  res.json({ bookings: await prisma.booking.findMany({ where, include, orderBy: { createdAt: 'desc' } }) });
}
async function getOne(req, res) { const booking = await prisma.booking.findUnique({ where: { id: req.params.id }, include }); if (!booking) return res.status(404).json({ error: 'Booking not found' }); const p = req.user.role === 'ADMIN' ? null : await currentProfile(req.user.userId, req.user.role); if (req.user.role === 'CUSTOMER' && booking.customerId !== p?.id || req.user.role === 'PROVIDER' && booking.providerId !== p?.id) return res.status(403).json({ error: 'You do not have access to this booking' }); res.json({ booking }); }
async function updateStatus(req, res) {
  const { status } = req.body;
  if (!Object.hasOwn(transitions, status)) return res.status(400).json({ error: 'Invalid booking status' });
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  const provider = req.user.role === 'PROVIDER' ? await currentProfile(req.user.userId, 'PROVIDER') : null;
  if (req.user.role === 'PROVIDER' && booking.providerId !== provider?.id) return res.status(403).json({ error: 'You can only update your own bookings' });
  if (req.user.role === 'CUSTOMER') return res.status(403).json({ error: 'Customers cannot update booking status' });
  if (req.user.role === 'PROVIDER' && !['ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'].includes(status)) return res.status(403).json({ error: 'Providers cannot set this status' });
  if (!transitions[booking.status].includes(status)) return res.status(400).json({ error: `Cannot transition from ${booking.status} to ${status}` });
  const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status }, include }); res.json({ booking: updated });
}
async function cancel(req, res) { const booking = await prisma.booking.findUnique({ where: { id: req.params.id } }); if (!booking) return res.status(404).json({ error: 'Booking not found' }); const customer = await currentProfile(req.user.userId, 'CUSTOMER'); if (booking.customerId !== customer?.id) return res.status(403).json({ error: 'You can only cancel your own bookings' }); if (!['PENDING', 'ACCEPTED'].includes(booking.status)) return res.status(400).json({ error: 'This booking can no longer be cancelled' }); const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' }, include }); res.json({ booking: updated }); }
module.exports = { create, list, getOne, updateStatus, cancel };
