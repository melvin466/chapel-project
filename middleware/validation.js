const { body, validationResult } = require('express-validator');
const Joi = require('joi');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const validateRegister = [
  body('firstName').notEmpty().withMessage('First name required'),
  body('lastName').notEmpty().withMessage('Last name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phoneNumber').notEmpty().withMessage('Phone number required'),
  validate
];

const validateLogin = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  validate
];

const validateEvent = [
  body('title').notEmpty().withMessage('Title required'),
  body('description').notEmpty().withMessage('Description required'),
  body('type').notEmpty().withMessage('Event type required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required'),
  body('location').notEmpty().withMessage('Location required'),
  validate
];

const validateBooking = [
  body('bookingType').isIn(['counselling', 'wedding', 'baptism', 'facility', 'appointment']).withMessage('Valid booking type required'),
  body('requestedDate').isISO8601().withMessage('Valid requested date required'),
  body('requestedTime').notEmpty().withMessage('Requested time required'),
  body('purpose').notEmpty().withMessage('Purpose required'),
  body('numberOfPeople').optional().isInt({ min: 1 }).withMessage('Number of people must be at least 1'),
  validate
];

const validateCell = [
  body('name').notEmpty().withMessage('Cell name required'),
  body('zone').notEmpty().withMessage('Zone required'),
  body('location').notEmpty().withMessage('Location required'),
  body('meetingDay').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).withMessage('Valid meeting day required'),
  body('meetingTime').notEmpty().withMessage('Meeting time required'),
  body('meetingVenue').notEmpty().withMessage('Meeting venue required'),
  body('leader').isMongoId().withMessage('Valid leader ID required'),
  body('assistantLeader').optional().isMongoId().withMessage('Valid assistant leader ID required'),
  body('maxCapacity').optional().isInt({ min: 1 }).withMessage('Max capacity must be at least 1'),
  validate
];

const validateSermon = [
  body('title').notEmpty().withMessage('Title required'),
  body('speaker').notEmpty().withMessage('Speaker required'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('serviceType').optional().isIn(['sunday', 'wednesday', 'friday', 'conference', 'special']).withMessage('Valid service type required'),
  body('description').notEmpty().withMessage('Description required'),
  body('bibleVerses').optional().isArray().withMessage('Bible verses must be an array'),
  body('duration').optional().isInt({ min: 0 }).withMessage('Duration must be a positive number'),
  validate
];

const validatePrayerRequest = [
  body('title').notEmpty().withMessage('Title required'),
  body('description').notEmpty().withMessage('Description required'),
  body('category').optional().isIn(['personal', 'family', 'health', 'academic', 'financial', 'spiritual', 'other']).withMessage('Valid category required'),
  body('urgency').optional().isIn(['normal', 'urgent', 'critical']).withMessage('Valid urgency level required'),
  body('isAnonymous').optional().isBoolean().withMessage('isAnonymous must be a boolean'),
  validate
];

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const validateSchema = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

module.exports = { validateRegister, validateLogin, validateEvent, validateBooking, validateCell, validateSermon, validatePrayerRequest, validateSchema, registerSchema, validate };