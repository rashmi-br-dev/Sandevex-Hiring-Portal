import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Offer from "@/models/Offer";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        await connectDB();

        const { offerId } = await req.json();

        if (!offerId) {
            return NextResponse.json(
                { error: "Offer ID is required" },
                { status: 400 }
            );
        }

        const offer = await Offer.findById(offerId);

        if (!offer) {
            return NextResponse.json(
                { error: "Offer not found" },
                { status: 404 }
            );
        }

        // Generate new token
        const token = crypto.randomBytes(32).toString("hex");

        // Reset offer
        offer.token = token;
        offer.status = "pending";
        offer.sentAt = new Date();
        offer.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        offer.respondedAt = undefined;

        await offer.save();

        return NextResponse.json({
            success: true,
            token, // ✅ Include this
            expiresAt: offer.expiresAt
        });
    } catch (error) {
        console.error("Error resending offer:", error);
        return NextResponse.json(
            { error: "Failed to resend offer" },
            { status: 500 }
        );
    }
}