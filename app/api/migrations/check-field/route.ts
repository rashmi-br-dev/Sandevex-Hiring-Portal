import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Offer from "@/models/Offer";

export async function GET() {
    try {
        await connectDB();

        const totalOffers = await Offer.countDocuments();
        const withField = await Offer.countDocuments({ physicalLetterCollected: { $exists: true } });
        const withoutField = await Offer.countDocuments({ physicalLetterCollected: { $exists: false } });

        const sampleOffer = await Offer.findOne({});

        return NextResponse.json({
            success: true,
            totalOffers,
            withField,
            withoutField,
            sampleOffer: sampleOffer ? {
                id: sampleOffer._id,
                hasPhysicalLetterField: sampleOffer.physicalLetterCollected !== undefined,
                physicalLetterCollected: sampleOffer.physicalLetterCollected
            } : null
        });

    } catch (error) {
        return NextResponse.json({ error: "Check failed" }, { status: 500 });
    }
}