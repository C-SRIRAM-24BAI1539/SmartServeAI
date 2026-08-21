function notFound(req, res) { res.status(404).json({ error: 'Route not found' }); }
function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.code === 'P2002') return res.status(409).json({ error: 'A record with those details already exists' });
  res.status(err.status || 500).json({ error: err.message || 'Unexpected server error' });
}
module.exports = { notFound, errorHandler };
