const forbiddenKeyPattern = /[$.]/;

const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.entries(value).reduce((clean, [key, nestedValue]) => {
    if (!forbiddenKeyPattern.test(key)) {
      clean[key] = sanitizeValue(nestedValue);
    }
    return clean;
  }, {});
};

const sanitizeRequest = (req, res, next) => {
  req.body = sanitizeValue(req.body);
  req.params = sanitizeValue(req.params);

  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      if (forbiddenKeyPattern.test(key)) {
        delete req.query[key];
      } else {
        req.query[key] = sanitizeValue(req.query[key]);
      }
    }
  }

  next();
};

module.exports = sanitizeRequest;
