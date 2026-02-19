import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Offer from "@/models/Offer";

export async function POST(req: Request) {
    try {
        await connectDB();

        const { token, action } = await req.json();

        if (!token || !action) {
            return NextResponse.json(
                { error: "Token and action are required" },
                { status: 400 }
            );
        }

        if (action !== "accept" && action !== "decline") {
            return NextResponse.json(
                { error: "Invalid action" },
                { status: 400 }
            );
        }

        const offer = await Offer.findOne({ token });

        if (!offer) {
            return NextResponse.json(
                { error: "Invalid offer link" },
                { status: 404 }
            );
        }

        if (offer.status !== "pending") {
            return NextResponse.json(
                { error: `Offer already ${offer.status}` },
                { status: 400 }
            );
        }

        if (new Date() > offer.expiresAt) {
            offer.status = "expired";
            await offer.save();
            return NextResponse.json(
                { error: "Offer expired" },
                { status: 400 }
            );
        }

        offer.status = action === "accept" ? "accepted" : "declined";
        offer.respondedAt = new Date();

        await offer.save();

        return NextResponse.json({ 
            success: true, 
            status: offer.status 
        });
    } catch (error) {
        console.error("Error responding to offer:", error);
        return NextResponse.json(
            { error: "Failed to process response" },
            { status: 500 }
        );
    }
}