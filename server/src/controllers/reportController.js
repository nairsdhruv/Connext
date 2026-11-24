import { Report } from '../models/Report.js';

export const createReport = async (req, res, next) => {
  try {
    const { targetType, targetId, reason, details } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'targetType, targetId, and reason are required.'
      });
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetType,
      targetId,
      reason,
      details: details ? details.trim() : ''
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted. Thank you for keeping our community safe.',
      reportId: report._id
    });
  } catch (error) {
    next(error);
  }
};
