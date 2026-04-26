import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsageLog, UsageLogDocument } from '../database/usage-log.schema';

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  status?: string;
  provider?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(UsageLog.name) private usageLogModel: Model<UsageLogDocument>,
  ) {}

  async getUsage(filter: ReportFilter = {}) {
    const { startDate, endDate, status, provider, page = 1, limit = 50 } = filter;

    const match: any = {};
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = new Date(startDate);
      if (endDate) match.timestamp.$lte = new Date(endDate);
    }
    if (status) match.status = status;
    if (provider) match.providerUsed = provider;

    const [total, byProvider, byStatus, hourlyStats, recentLogs] = await Promise.all([
      this.usageLogModel.countDocuments(match),

      this.usageLogModel.aggregate([
        { $match: match },
        { $group: { _id: '$providerUsed', count: { $sum: 1 } } },
      ]),

      this.usageLogModel.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Chart: requests grouped by hour (last 24h or date range)
      this.usageLogModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' },
              hour: { $hour: '$timestamp' },
            },
            count: { $sum: 1 },
            success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $ne: ['$status', 'success'] }, 1, 0] } },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
        { $limit: 48 },
      ]),

      this.usageLogModel
        .find(match)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const formattedHourly = hourlyStats.map((h) => ({
      time: `${h._id.year}-${String(h._id.month).padStart(2, '0')}-${String(h._id.day).padStart(2, '0')} ${String(h._id.hour).padStart(2, '0')}:00`,
      count: h.count,
      success: h.success,
      failed: h.failed,
    }));

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      byProvider: byProvider.reduce((acc, cur) => ({ ...acc, [cur._id]: cur.count }), {}),
      byStatus: byStatus.reduce((acc, cur) => ({ ...acc, [cur._id]: cur.count }), {}),
      hourlyStats: formattedHourly,
      recentLogs,
    };
  }
}
