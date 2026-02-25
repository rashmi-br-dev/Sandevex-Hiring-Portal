import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DomainPreference from "@/models/DomainPreference";

export async function GET() {
    try {
        await connectDB();

        const preferences = await DomainPreference.find({});

        if (preferences.length === 0) {
            return NextResponse.json({
                success: true,
                summary: {
                    total: 0,
                    domainStats: {},
                    collegeStats: {},
                    skillLevelStats: {},
                    skillLevelByDomain: {},
                    technologyStats: {},
                    monthlyStats: {},
                }
            });
        }

        // Domain statistics
        const domainStats = preferences.reduce((acc, pref) => {
            const domain = pref.domain || 'Unknown';
            acc[domain] = (acc[domain] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // College statistics
        const collegeStats = preferences.reduce((acc, pref) => {
            const college = pref.collegeName || 'Unknown';
            acc[college] = (acc[college] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Skill level statistics
        const skillLevelStats = preferences.reduce((acc, pref) => {
            const level = pref.skillLevel || 'Unknown';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Skill level by domain
        const skillLevelByDomain: Record<string, Record<string, number>> = {};
        preferences.forEach(pref => {
            const domain = pref.domain || 'Unknown';
            const skillLevel = pref.skillLevel || 'Unknown';
            
            if (!skillLevelByDomain[domain]) {
                skillLevelByDomain[domain] = {};
            }
            skillLevelByDomain[domain][skillLevel] = (skillLevelByDomain[domain][skillLevel] || 0) + 1;
        });

        // Technology statistics
        const technologyStats = preferences.reduce((acc, pref) => {
            if (pref.technologies && Array.isArray(pref.technologies)) {
                pref.technologies.forEach(tech => {
                    if (tech && tech.trim()) {
                        acc[tech] = (acc[tech] || 0) + 1;
                    }
                });
            }
            return acc;
        }, {} as Record<string, number>);

        // Monthly statistics (last 6 months)
        const monthlyStats = preferences.reduce((acc, pref) => {
            if (pref.timestamp) {
                const date = new Date(pref.timestamp);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                acc[monthKey] = (acc[monthKey] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        // Sort and limit results for better display
        const sortedDomains = Object.entries(domainStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        const sortedColleges = Object.entries(collegeStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        const sortedTechnologies = Object.entries(technologyStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 15);

        return NextResponse.json({
            success: true,
            summary: {
                total: preferences.length,
                domainStats: Object.fromEntries(sortedDomains),
                collegeStats: Object.fromEntries(sortedColleges),
                skillLevelStats,
                skillLevelByDomain,
                technologyStats: Object.fromEntries(sortedTechnologies),
                monthlyStats,
            }
        });
    } catch (error) {
        console.error("Error fetching summary:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch summary" },
            { status: 500 }
        );
    }
}
