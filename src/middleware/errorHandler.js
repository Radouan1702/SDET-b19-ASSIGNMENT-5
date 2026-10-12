function errorHandler(error, req, res, next) {
  console.error(error);
  const isMalformedJson = error.type === 'entity.parse.failed';
  const status = isMalformedJson || error.statusCode === 400 || error.status === 400 ? 400 : 500;
  const message = status === 400 ? 'Invalid request body.' : 'Internal server error.';
  return res.status(status).json({ message });
}

module.exports = errorHandler;
