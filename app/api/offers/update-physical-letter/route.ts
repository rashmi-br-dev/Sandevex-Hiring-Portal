import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Offer from "@/models/Offer";

export async function POST(req: Request) {
    try {
        await connectDB();

        const { offerId, collected } = await req.json();

        if (!offerId) {
            return NextResponse.json(
                { error: "Offer ID is required" },
                { status: 400 }
            );
        }

        // Update the physicalLetterCollected field
        const offer = await Offer.findByIdAndUpdate(
            offerId,
            { physicalLetterCollected: collected },
            { new: true } // Return the updated document
        );

        if (!offer) {
            return NextResponse.json(
                { error: "Offer not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Physical letter status updated to ${collected ? 'collected' : 'not collected'}`,
            offer
        });

    } catch (error) {
        console.error("Error updating physical letter status:", error);
        return NextResponse.json(
            { error: "Failed to update physical letter status" },
            { status: 500 }
        );
    }
}

// Also add a GET endpoint to fetch offers with physical letter status
export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status'); // 'collected', 'not_collected', or null for all
        const candidateId = searchParams.get('candidateId');

        let query: any = {};

        if (status === 'collected') {
            query.physicalLetterCollected = true;
        } else if (status === 'not_collected') {
            query.physicalLetterCollected = false;
        }

        if (candidateId) {
            query.candidateId = candidateId;
        }

        const offers = await Offer.find(query)
            .populate('candidateId', 'fullName email collegeName')
            .sort({ updatedAt: -1 });

        return NextResponse.json({
            success: true,
            offers
        });

    } catch (error) {
        console.error("Error fetching offers:", error);
        return NextResponse.json(
            { error: "Failed to fetch offers" },
            { status: 500 }
        );
    }
}