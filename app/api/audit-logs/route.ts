import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AuditLog from "@/models/AuditLog";

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const entityType = searchParams.get("entityType");
        const action = searchParams.get("action");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const skip = (page - 1) * limit;

        // Build query
        let query: any = {};

        if (entityType) {
            query.entityType = entityType;
        }

        if (action) {
            query.action = action;
        }

        if (startDate || endDate) {
            query.performedAt = {};
            if (startDate) {
                query.performedAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.performedAt.$lte = new Date(endDate);
            }
        }

        // Get total count
        const total = await AuditLog.countDocuments(query);

        // Get audit logs with pagination
        const logs = await AuditLog.find(query)
            .sort({ performedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Get statistics
        const stats = await AuditLog.aggregate([
            {
                $group: {
                    _id: null,
                    totalLogs: { $sum: 1 },
                    createActions: { $sum: { $cond: [{ $eq: ["$action", "create"] }, 1, 0] } },
                    updateActions: { $sum: { $cond: [{ $eq: ["$action", "update"] }, 1, 0] } },
                    deleteActions: { $sum: { $cond: [{ $eq: ["$action", "delete"] }, 1, 0] } },
                    internLogs: { $sum: { $cond: [{ $eq: ["$entityType", "intern"] }, 1, 0] } },
                    profileLogs: { $sum: { $cond: [{ $eq: ["$entityType", "intern_profile"] }, 1, 0] } }
                }
            }
        ]);

        // Get recent activity by user
        const userActivity = await AuditLog.aggregate([
            {
                $match: {
                    performedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
                }
            },
            {
                $group: {
                    _id: "$performedBy",
                    count: { $sum: 1 },
                    lastActivity: { $max: "$performedAt" },
                    actions: { $push: "$action" }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);

        return NextResponse.json({
            success: true,
            data: {
                logs,
                stats: stats[0] || {
                    totalLogs: 0,
                    createActions: 0,
                    updateActions: 0,
                    deleteActions: 0,
                    internLogs: 0,
                    profileLogs: 0
                },
                userActivity,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error: any) {
        console.error("Error fetching audit logs:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
