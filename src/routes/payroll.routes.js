const express = require('express');
const router = express.Router();
const TimeEntry = require('../models/TimeEntry');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const logger = require('../utils/logger');

// @route   POST /api/v1/payroll/calculate
// @desc    Calculate payroll for an employee
// @access  Admin
router.post('/calculate', adminAuth, validate(schemas.processPayroll), async (req, res) => {
  try {
    const {
      employeeId,
      periodStart,
      periodEnd,
      hourlyRate,
      overtimeRate,
      deductions = [],
      bonuses = []
    } = req.body;

    logger.info('Calculating payroll', { employeeId, periodStart, periodEnd });

    // Get employee
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Get time entries for the period
    const timeEntries = await TimeEntry.find({
      user: employeeId,
      startTime: { $gte: new Date(periodStart), $lte: new Date(periodEnd) },
      status: 'stopped',
      'approved.status': 'approved'
    });

    // Calculate hours
    let regularHours = 0;
    let overtimeHours = 0;
    let totalHours = 0;

    // Group by week for overtime calculation
    const weeklyHours = {};
    
    timeEntries.forEach(entry => {
      const weekStart = getWeekStart(entry.startTime);
      const weekKey = weekStart.toISOString();
      
      if (!weeklyHours[weekKey]) {
        weeklyHours[weekKey] = 0;
      }
      
      const hours = entry.duration / 3600;
      weeklyHours[weekKey] += hours;
      totalHours += hours;
    });

    // Calculate regular and overtime hours (40 hours per week threshold)
    Object.values(weeklyHours).forEach(weekHours => {
      if (weekHours > 40) {
        regularHours += 40;
        overtimeHours += weekHours - 40;
      } else {
        regularHours += weekHours;
      }
    });

    // Calculate gross pay
    const rate = hourlyRate || employee.hourlyRate || 0;
    const otRate = overtimeRate || employee.overtimeRate || (rate * 1.5);
    
    const regularPay = regularHours * rate;
    const overtimePay = overtimeHours * otRate;
    const bonusTotal = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
    const grossPay = regularPay + overtimePay + bonusTotal;

    // Calculate deductions
    const deductionTotal = deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
    
    // Calculate net pay
    const netPay = grossPay - deductionTotal;

    const payrollData = {
      employee: {
        id: employee._id,
        name: employee.fullName,
        email: employee.email,
        employeeId: employee.employeeId
      },
      period: {
        start: periodStart,
        end: periodEnd
      },
      hours: {
        regular: regularHours.toFixed(2),
        overtime: overtimeHours.toFixed(2),
        total: totalHours.toFixed(2)
      },
      rates: {
        regular: rate,
        overtime: otRate
      },
      earnings: {
        regular: regularPay.toFixed(2),
        overtime: overtimePay.toFixed(2),
        bonuses: bonuses,
        bonusTotal: bonusTotal.toFixed(2),
        gross: grossPay.toFixed(2)
      },
      deductions: {
        items: deductions,
        total: deductionTotal.toFixed(2)
      },
      netPay: netPay.toFixed(2),
      currency: employee.currency || 'USD'
    };

    logger.info('Payroll calculated', { 
      employeeId, 
      totalHours, 
      netPay 
    });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`company:${req.user.company}`).emit('payroll:calculated', {
        employeeId,
        period: { start: periodStart, end: periodEnd },
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Payroll calculated successfully',
      data: payrollData
    });
  } catch (error) {
    logger.error('Calculate payroll error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to calculate payroll',
      error: error.message
    });
  }
});

// @route   GET /api/v1/payroll/summary
// @desc    Get payroll summary for a period
// @access  Admin
router.get('/summary', adminAuth, async (req, res) => {
  try {
    const { periodStart, periodEnd } = req.query;
    const companyId = req.user.company;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({
        success: false,
        message: 'Period start and end dates are required'
      });
    }

    // Get all employees
    const employees = await User.find({
      company: companyId,
      status: 'active'
    });

    const payrollSummary = [];

    for (const employee of employees) {
      // Get approved time entries
      const timeEntries = await TimeEntry.find({
        user: employee._id,
        startTime: { $gte: new Date(periodStart), $lte: new Date(periodEnd) },
        status: 'stopped',
        'approved.status': 'approved'
      });

      const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.duration / 3600), 0);
      const billableHours = timeEntries
        .filter(entry => entry.billable)
        .reduce((sum, entry) => sum + (entry.duration / 3600), 0);

      const estimatedPay = totalHours * (employee.hourlyRate || 0);

      payrollSummary.push({
        employee: {
          id: employee._id,
          name: employee.fullName,
          email: employee.email,
          department: employee.department,
          position: employee.position
        },
        hours: {
          total: totalHours.toFixed(2),
          billable: billableHours.toFixed(2)
        },
        estimatedPay: estimatedPay.toFixed(2),
        entriesCount: timeEntries.length
      });
    }

    // Calculate totals
    const totals = {
      employees: payrollSummary.length,
      totalHours: payrollSummary.reduce((sum, item) => sum + parseFloat(item.hours.total), 0).toFixed(2),
      totalBillableHours: payrollSummary.reduce((sum, item) => sum + parseFloat(item.hours.billable), 0).toFixed(2),
      totalEstimatedPay: payrollSummary.reduce((sum, item) => sum + parseFloat(item.estimatedPay), 0).toFixed(2)
    };

    res.json({
      success: true,
      data: {
        period: {
          start: periodStart,
          end: periodEnd
        },
        summary: payrollSummary,
        totals
      }
    });
  } catch (error) {
    logger.error('Get payroll summary error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get payroll summary',
      error: error.message
    });
  }
});

// @route   GET /api/v1/payroll/employee/:id
// @desc    Get employee payroll history
// @access  Private (own data) or Admin (any employee)
router.get('/employee/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 12 } = req.query;

    // Check permissions
    if (req.user._id.toString() !== id && req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // For this example, we'll return calculated monthly summaries
    // In production, you'd have a Payroll model to store processed payrolls
    const monthlyPayrolls = [];
    const currentDate = new Date();
    
    for (let i = 0; i < limit; i++) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);

      const timeEntries = await TimeEntry.find({
        user: id,
        startTime: { $gte: monthStart, $lte: monthEnd },
        status: 'stopped'
      });

      const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.duration / 3600), 0);
      
      if (totalHours > 0) {
        const employee = await User.findById(id);
        const estimatedPay = totalHours * (employee.hourlyRate || 0);

        monthlyPayrolls.push({
          period: {
            month: monthStart.toLocaleString('default', { month: 'long' }),
            year: monthStart.getFullYear(),
            start: monthStart,
            end: monthEnd
          },
          hours: totalHours.toFixed(2),
          grossPay: estimatedPay.toFixed(2),
          status: 'calculated', // or 'paid', 'pending', etc.
          paidDate: null
        });
      }
    }

    res.json({
      success: true,
      data: {
        employee: id,
        payrolls: monthlyPayrolls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get employee payroll error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get employee payroll',
      error: error.message
    });
  }
});

// @route   POST /api/v1/payroll/approve-hours
// @desc    Approve time entries for payroll
// @access  Admin
router.post('/approve-hours', adminAuth, async (req, res) => {
  try {
    const { timeEntryIds, notes } = req.body;
    const approverId = req.user._id;

    logger.info('Approving hours for payroll', { 
      count: timeEntryIds.length,
      approverId 
    });

    const results = {
      approved: [],
      failed: []
    };

    for (const entryId of timeEntryIds) {
      try {
        const entry = await TimeEntry.findById(entryId);
        
        if (!entry) {
          results.failed.push({ id: entryId, reason: 'Not found' });
          continue;
        }

        if (entry.status !== 'stopped') {
          results.failed.push({ id: entryId, reason: 'Timer still running' });
          continue;
        }

        entry.approved = {
          status: 'approved',
          by: approverId,
          at: new Date(),
          notes
        };

        await entry.save();
        results.approved.push(entryId);

      } catch (error) {
        results.failed.push({ id: entryId, reason: error.message });
      }
    }

    logger.info('Hours approval completed', results);

    res.json({
      success: true,
      message: 'Hours approval process completed',
      data: results
    });
  } catch (error) {
    logger.error('Approve hours error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to approve hours',
      error: error.message
    });
  }
});

// Helper function to get week start date
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

module.exports = router;