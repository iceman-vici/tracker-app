const Joi = require('joi');
const logger = require('../utils/logger');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation failed', { 
        errors, 
        body: req.body,
        url: req.originalUrl 
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    next();
  };
};

const schemas = {
  // Auth schemas
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    companyName: Joi.string(),
    timezone: Joi.string(),
    role: Joi.string().valid('owner', 'admin', 'manager', 'employee')
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Time tracking schemas
  startTimer: Joi.object({
    projectId: Joi.string(),
    taskId: Joi.string(),
    description: Joi.string(),
    tags: Joi.array().items(Joi.string())
  }),

  stopTimer: Joi.object({
    timeEntryId: Joi.string().required()
  }),

  // Project schemas
  createProject: Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
    clientId: Joi.string(),
    budget: Joi.number(),
    hourlyRate: Joi.number(),
    status: Joi.string().valid('active', 'on-hold', 'completed', 'cancelled'),
    startDate: Joi.date(),
    endDate: Joi.date(),
    teamMembers: Joi.array().items(Joi.string())
  }),

  // Task schemas
  createTask: Joi.object({
    title: Joi.string().required(),
    description: Joi.string(),
    projectId: Joi.string().required(),
    assignedTo: Joi.string(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
    status: Joi.string().valid('todo', 'in-progress', 'review', 'done'),
    dueDate: Joi.date(),
    estimatedHours: Joi.number()
  }),

  // Payroll schemas
  processPayroll: Joi.object({
    employeeId: Joi.string().required(),
    periodStart: Joi.date().required(),
    periodEnd: Joi.date().required(),
    hourlyRate: Joi.number(),
    overtimeRate: Joi.number(),
    deductions: Joi.array().items(Joi.object({
      type: Joi.string().required(),
      amount: Joi.number().required()
    })),
    bonuses: Joi.array().items(Joi.object({
      type: Joi.string().required(),
      amount: Joi.number().required()
    }))
  }),

  // Invoice schemas
  createInvoice: Joi.object({
    clientId: Joi.string().required(),
    projectId: Joi.string(),
    items: Joi.array().items(Joi.object({
      description: Joi.string().required(),
      quantity: Joi.number().required(),
      rate: Joi.number().required(),
      amount: Joi.number()
    })).required(),
    dueDate: Joi.date().required(),
    notes: Joi.string(),
    terms: Joi.string()
  })
};

module.exports = {
  validate,
  schemas
};