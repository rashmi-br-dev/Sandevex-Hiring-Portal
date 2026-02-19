import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Offer from "@/models/Offer";

export async function POST() {
    try {
        await connectDB();

        // Update all existing offers to add physicalLetterCollected field if it doesn't exist
        const result = await Offer.updateMany(
            { physicalLetterCollected: { $exists: false } },
            { $set: { physicalLetterCollected: false } }
        );

        return NextResponse.json({
            success: true,
            message: `Updated ${result.modifiedCount} offers with physicalLetterCollected field`,
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount
        });

    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json(
            { error: "Failed to run migration" },
            { status: 500 }
        );
    }
}

// Also add GET method for easier browser testing
export async function GET() {
    return POST();
}