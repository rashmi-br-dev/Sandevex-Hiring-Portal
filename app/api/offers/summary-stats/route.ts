import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Student from "@/models/Student";
import Offer from "@/models/Offer";

export async function GET() {
    try {
        await connectDB();

        // Get all students
        const totalCandidates = await Student.countDocuments();
        
        // Get all offers
        const allOffers = await Offer.find({}).lean();
        
        // Get students with offers
        const studentsWithOffers = new Set(
            allOffers.map(offer => offer.candidateId.toString())
        );

        // Count offers by status
        const offerCounts = {
            pending: 0,
            accepted: 0,
            declined: 0,
            expired: 0
        };

        allOffers.forEach(offer => {
            offerCounts[offer.status as keyof typeof offerCounts]++;
        });

        // Calculate not sent
        const notSent = totalCandidates - studentsWithOffers.size;

        // Get daily trend (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyTrend = await Offer.aggregate([
            {
                $match: {
                    sentAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$sentAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            },
            {
                $project: {
                    date: "$_id",
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // Get college distribution for accepted offers
        const collegeDistribution = await Offer.aggregate([
            {
                $match: { 
                    status: "accepted",
                    candidateId: { $exists: true, $ne: null }
                }
            },
            {
                $lookup: {
                    from: "students",
                    localField: "candidateId",
                    foreignField: "_id",
                    as: "student"
                }
            },
            {
                $unwind: { 
                    path: "$student", 
                    preserveNullAndEmptyArrays: false 
                }
            },
            {
                $group: {
                    _id: "$student.collegeName",
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    $and: [
                        { _id: { $ne: null } },
                        { _id: { $ne: "" } }
                    ]
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            },
            {
                $project: {
                    name: "$_id",
                    value: "$count",
                    _id: 0
                }
            }
        ]);

        return NextResponse.json({
            total: totalCandidates,
            notSent,
            pending: offerCounts.pending,
            accepted: offerCounts.accepted,
            declined: offerCounts.declined,
            expired: offerCounts.expired,
            dailyTrend,
            collegeDistribution
        });
    } catch (error) {
        console.error("Error fetching offer summary stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch summary statistics" },
            { status: 500 }
        );
    }
}