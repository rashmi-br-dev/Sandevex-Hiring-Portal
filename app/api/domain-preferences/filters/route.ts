import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DomainPreference from "@/models/DomainPreference";

export async function GET() {
    try {
        await connectDB();

        // Get all domain preferences to extract unique values
        const preferences = await DomainPreference.find({});

        // Extract unique colleges
        const colleges = [...new Set(preferences.map(p => p.collegeName).filter(Boolean))].sort();

        // Extract unique domains
        const domains = [...new Set(preferences.map(p => p.domain).filter(Boolean))].sort();

        // Extract unique skill levels
        const skillLevels = [...new Set(preferences.map(p => p.skillLevel).filter(Boolean))].sort();

        return NextResponse.json({
            success: true,
            colleges,
            domains,
            skillLevels,
        });
    } catch (error) {
        console.error("Error fetching filters:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch filters" },
            { status: 500 }
        );
    }
}
