const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isId = value => typeof value === 'string' && value.trim().length > 0;
const isPositiveNumber = value => Number.isFinite(Number(value)) && Number(value) >= 0;
const isDate = value => !Number.isNaN(new Date(value).getTime());
function requireFields(body, fields) {
  return fields.find(field => body[field] === undefined || body[field] === null || body[field] === '');
}
module.exports = { emailPattern, isId, isPositiveNumber, isDate, requireFields };
