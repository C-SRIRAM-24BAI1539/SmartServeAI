const prisma = require('../lib/prisma');
const { requireFields } = require('../utils/validation');
async function list(req, res) { res.json({ categories: await prisma.serviceCategory.findMany({ orderBy: { categoryName: 'asc' } }) }); }
async function create(req, res) { const missing = requireFields(req.body, ['categoryName']); if (missing) return res.status(400).json({ error: 'Category name is required' }); const category = await prisma.serviceCategory.create({ data: { categoryName: req.body.categoryName.trim(), description: req.body.description || null } }); res.status(201).json({ category }); }
async function update(req, res) { const category = await prisma.serviceCategory.update({ where: { id: req.params.id }, data: { ...(req.body.categoryName !== undefined && { categoryName: req.body.categoryName.trim() }), ...(req.body.description !== undefined && { description: req.body.description }) } }); res.json({ category }); }
async function remove(req, res) { await prisma.serviceCategory.delete({ where: { id: req.params.id } }); res.status(204).end(); }
module.exports = { list, create, update, remove };
