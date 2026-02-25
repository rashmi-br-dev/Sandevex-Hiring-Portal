import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DomainPreference from "@/models/DomainPreference";

export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);

        const search = searchParams.get("search") || "";
        const domain = searchParams.get("domain") || "";
        const college = searchParams.get("college") || "";
        const skillLevel = searchParams.get("skillLevel") || "";
        const page = Number(searchParams.get("page") || 1);
        const limit = Number(searchParams.get("limit") || 10);

        const skip = (page - 1) * limit;

        let query: any = {};

        // SEARCH
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { contactNumber: { $regex: search, $options: "i" } },
                { collegeName: { $regex: search, $options: "i" } },
            ];
        }

        // DOMAIN FILTER
        if (domain) {
            query.domain = domain;
        }

        // COLLEGE FILTER
        if (college) {
            query.collegeName = { $regex: college, $options: "i" };
        }

        // SKILL LEVEL FILTER
        if (skillLevel) {
            query.skillLevel = skillLevel;
        }

        const domainPreferences = await DomainPreference.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        const total = await DomainPreference.countDocuments(query);

        return NextResponse.json({
            success: true,
            data: domainPreferences,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching domain preferences:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch domain preferences" },
            { status: 500 }
        );
    }
}
