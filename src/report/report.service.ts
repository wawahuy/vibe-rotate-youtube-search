import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsageLog, UsageLogDocument } from './schemas/usage-log.schema';
import { ReportQueryDto } from './dto/report-query.dto';

export interface CreateLogDto {
  endpoint: string;
  method?: string;
  providerUsed?: string;
  apiKeyId?: string | null;
  userApiKeyId?: string | null;
  status?: 'success' | 'error';
  statusCode?: number;
  query?: string;
  errorMessage?: string;
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectModel(UsageLog.name)
    private readonly logModel: Model<UsageLogDocument>,
  ) {}

  async createLog(dto: CreateLogDto): Promise<void> {
    try {
      await this.logModel.create({
        endpoint: dto.endpoint,
        method: dto.method || 'GET',
        providerUsed: dto.providerUsed || null,
        apiKeyId: dto.apiKeyId ? new Types.ObjectId(dto.apiKeyId) : null,
        userApiKeyId: dto.userApiKeyId ? new Types.ObjectId(dto.userApiKeyId) : null,
        timestamp: new Date(),
        status: dto.status || 'success',
        statusCode: dto.statusCode || 200,
        query: dto.query || null,
        errorMessage: dto.errorMessage || null,
      });
    } catch (err) {
      this.logger.error(`Failed to create usage log: ${err.message}`);
    }
  }

  /** Paginated raw usage logs */
  async getUsageLogs(query: ReportQueryDto) {
    const filter = this.buildFilter(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.logModel
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userApiKeyId', 'name key')
        .populate('apiKeyId', 'provider name')
        .lean()
        .exec(),
      this.logModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Requests grouped by day */
  async getUsageByTime(query: ReportQueryDto) {
    const filter = this.buildFilter(query);
    return this.logModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 },
          success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          error: { $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, success: 1, error: 1, _id: 0 } },
    ]);
  }

  /** Requests grouped by provider */
  async getProviderStats(query: ReportQueryDto) {
    const filter = this.buildFilter(query);
    return this.logModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$providerUsed',
          count: { $sum: 1 },
          success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          error: { $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } },
        },
      },
      { $project: { provider: '$_id', count: 1, success: 1, error: 1, _id: 0 } },
    ]);
  }

  /** Requests grouped by user API key */
  async getUserStats(query: ReportQueryDto) {
    const filter = this.buildFilter(query);
    return this.logModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$userApiKeyId',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'userapikeys',
          localField: '_id',
          foreignField: '_id',
          as: 'userKey',
        },
      },
      { $unwind: { path: '$userKey', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userKeyId: '$_id',
          keyName: { $ifNull: ['$userKey.name', 'Anonymous/Admin'] },
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
  }

  /** Dashboard summary */
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCount, totalCount, providerStats, recentLogs] = await Promise.all([
      this.logModel.countDocuments({ timestamp: { $gte: today } }),
      this.logModel.countDocuments({}),
      this.logModel.aggregate([
        { $match: { timestamp: { $gte: today } } },
        { $group: { _id: '$providerUsed', count: { $sum: 1 } } },
      ]),
      this.logModel
        .find()
        .sort({ timestamp: -1 })
        .limit(10)
        .populate('userApiKeyId', 'name key')
        .lean()
        .exec(),
    ]);

    return { todayCount, totalCount, providerStats, recentLogs };
  }

  private buildFilter(query: ReportQueryDto): Record<string, any> {
    const filter: Record<string, any> = {};
    if (query.from || query.to) {
      filter.timestamp = {};
      if (query.from) filter.timestamp.$gte = new Date(query.from);
      if (query.to) filter.timestamp.$lte = new Date(query.to);
    }
    if (query.provider) filter.providerUsed = query.provider;
    if (query.userKeyId) {
      try {
        filter.userApiKeyId = new Types.ObjectId(query.userKeyId);
      } catch {
        // invalid ObjectId — ignore filter
      }
    }
    return filter;
  }
}
