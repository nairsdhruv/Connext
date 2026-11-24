export const validate = (schema) => async (req, res, next) => {
  try {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params
    });
    // Replace with parsed/sanitized data where applicable
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;
    next();
  } catch (error) {
    if (error.errors) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.slice(1).join('.'),
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: formattedErrors[0]?.message || 'Validation error',
        errors: formattedErrors
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || 'Invalid request parameters'
    });
  }
};
