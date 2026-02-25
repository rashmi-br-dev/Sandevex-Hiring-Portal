import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Intern, InternProfile } from "@/models/intern";

interface InternWithProfile {
    _id: string;
    fullName: string;
    email: string;
    collegeName?: string;
    preferredDomain?: string;
    skillLevel?: string;
    offerStatus?: string;
    internshipStatus?: string;
    internshipFeePaid?: boolean;
    offerLetterIssued?: boolean;
    certificateIssued?: boolean;
    joinedAt?: Date;
    completedAt?: Date;
    createdAt: string;
    updatedAt: string;
    profile?: {
        updatedAt?: string;
    };
}

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        // Get all interns with their profiles
        const interns = await Intern.aggregate([
            {
                $lookup: {
                    from: "internprofiles",
                    localField: "_id",
                    foreignField: "internId",
                    as: "profile"
                }
            },
            {
                $unwind: {
                    path: "$profile",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    fullName: 1,
                    email: 1,
                    collegeName: 1,
                    preferredDomain: "$profile.preferredDomain",
                    skillLevel: "$profile.skillLevel",
                    offerStatus: "$profile.offerStatus",
                    internshipStatus: "$profile.internshipStatus",
                    internshipFeePaid: "$profile.internshipFeePaid",
                    offerLetterIssued: "$profile.offerLetterIssued",
                    certificateIssued: "$profile.certificateIssued",
                    joinedAt: "$profile.joinedAt",
                    completedAt: "$profile.completedAt",
                    createdAt: 1,
                    updatedAt: 1,
                    "profile.updatedAt": "$profile.updatedAt"
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        // Domain Analysis
        const domainStats = interns.reduce((acc: Record<string, any>, intern: InternWithProfile) => {
            const domain = intern.preferredDomain || 'Unknown';
            if (!acc[domain]) {
                acc[domain] = {
                    total: 0,
                    active: 0,
                    completed: 0,
                    terminated: 0,
                    feePaid: 0,
                    certificateIssued: 0
                };
            }
            acc[domain].total++;
            if (intern.internshipStatus === 'active') acc[domain].active++;
            if (intern.internshipStatus === 'completed') acc[domain].completed++;
            if (intern.internshipStatus === 'terminated') acc[domain].terminated++;
            if (intern.internshipFeePaid) acc[domain].feePaid++;
            if (intern.certificateIssued) acc[domain].certificateIssued++;
            return acc;
        }, {});

        // Monthly Conversion Analysis
        const monthlyConversions = interns.reduce((acc: Record<string, any>, intern: InternWithProfile) => {
            const date = new Date(intern.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[monthKey]) {
                acc[monthKey] = {
                    month: monthKey,
                    count: 0,
                    domains: {}
                };
            }
            acc[monthKey].count++;
            
            const domain = intern.preferredDomain || 'Unknown';
            if (!acc[monthKey].domains[domain]) {
                acc[monthKey].domains[domain] = 0;
            }
            acc[monthKey].domains[domain]++;
            
            return acc;
        }, {});

        // Overall Statistics
        const totalStats = {
            totalInterns: interns.length,
            activeInterns: interns.filter((i: InternWithProfile) => i.internshipStatus === 'active').length,
            completedInterns: interns.filter((i: InternWithProfile) => i.internshipStatus === 'completed').length,
            terminatedInterns: interns.filter((i: InternWithProfile) => i.internshipStatus === 'terminated').length,
            feePaidInterns: interns.filter((i: InternWithProfile) => i.internshipFeePaid).length,
            certificateIssuedInterns: interns.filter((i: InternWithProfile) => i.certificateIssued).length,
            offerLetterIssuedInterns: interns.filter((i: InternWithProfile) => i.offerLetterIssued).length
        };

        // Recent Activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentActivity = interns.filter((intern: InternWithProfile) => 
            new Date(intern.createdAt) >= thirtyDaysAgo || 
            (intern.profile?.updatedAt && new Date(intern.profile.updatedAt) >= thirtyDaysAgo)
        ).map((intern: InternWithProfile) => ({
            _id: intern._id,
            fullName: intern.fullName,
            email: intern.email,
            preferredDomain: intern.preferredDomain,
            internshipStatus: intern.internshipStatus,
            createdAt: intern.createdAt,
            updatedAt: intern.profile?.updatedAt || intern.updatedAt,
            activity: new Date(intern.createdAt) >= thirtyDaysAgo ? 'created' : 'updated' as const
        }));

        // Skill Level Distribution
        const skillLevelStats = interns.reduce((acc: Record<string, any>, intern: InternWithProfile) => {
            const level = intern.skillLevel || 'Unknown';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {});

        return NextResponse.json({
            success: true,
            data: {
                totalStats,
                domainStats: Object.entries(domainStats).map(([domain, stats]) => ({
                    domain,
                    ...stats
                })),
                monthlyConversions: Object.values(monthlyConversions).sort((a: any, b: any) => 
                    b.month.localeCompare(a.month)
                ),
                recentActivity,
                skillLevelStats: Object.entries(skillLevelStats).map(([level, count]) => ({
                    level,
                    count
                })),
                interns: interns.slice(0, 10) // Recent 10 interns for display
            }
        });

    } catch (error: any) {
        console.error("Error fetching intern summary:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
