const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { validateEmail } = require('../utils/validation');

const bulkUploadUsers = async (req, res, next) => {
  try {
    const { users } = req.body;

    if (!users || !Array.isArray(users)) {
      return errorResponse(res, 'Invalid data format. Expected array of users.', 400);
    }

    const results = {
      added: 0,
      updated: 0,
      failed: 0,
      errors: []
    };

    for (const userData of users) {
      try {
        const { employeeId, name, email, password, role } = userData;

        if (!employeeId || !name || !email || !password) {
          results.failed++;
          results.errors.push(`Missing required fields for: ${email || 'unknown'}`);
          continue;
        }

        const emailError = validateEmail(email);
        if (emailError) {
          results.failed++;
          results.errors.push(`Invalid email ${email}: ${emailError}`);
          continue;
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
          existingUser.name = name;
          if (role && ['admin', 'approver', 'requester'].includes(role)) {
            existingUser.role = role;
          }
          await existingUser.save();
          results.updated++;
        } else {
          await User.create({
            employeeId,
            name,
            email,
            password,
            role: role || 'requester'
          });
          results.added++;
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`Error processing: ${userData.email || 'unknown'} - ${err.message}`);
      }
    }

    return successResponse(res, { results }, `Bulk upload completed. Added: ${results.added}, Updated: ${results.updated}, Failed: ${results.failed}`);
  } catch (error) {
    next(error);
  }
};

const downloadTemplate = async (req, res) => {
  const csvContent = 'employeeId,name,email,password,role\nEMP001,John Doe,john.doe@example.com,password123,requester\nEMP002,Jane Smith,jane.smith@example.com,password456,approver';

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=user_upload_template.csv');
  res.send(csvContent);
};

module.exports = { bulkUploadUsers, downloadTemplate };