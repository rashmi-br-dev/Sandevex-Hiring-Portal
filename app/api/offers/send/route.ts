import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import Offer from "@/models/Offer";
import { expireOldOffers } from "@/lib/expireOffers";

export async function POST(req: Request) {
    try {
        await connectDB();

        const { candidateId, email } = await req.json();

        // STEP 1: expire old pending offers
        await expireOldOffers(candidateId);

        // STEP 2: check active offer
        const active = await Offer.findOne({
            candidateId,
            status: "pending"
        });

        if (active) {
            return NextResponse.json(
                { error: "Candidate already has active offer" },
                { status: 400 }
            );
        }

        // STEP 3: block if accepted
        const accepted = await Offer.findOne({
            candidateId,
            status: "accepted"
        });

        if (accepted) {
            return NextResponse.json(
                { error: "Candidate already accepted offer" },
                { status: 400 }
            );
        }

        // STEP 4: create new offer
        const token = crypto.randomBytes(32).toString("hex");
        console.log("Generated token:", token);

        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

        const offer = await Offer.create({
            candidateId,
            email,
            token,
            expiresAt,
            status: "pending"
        });
        console.log("Created offer:", offer);

        // ✅ Return token directly at root level (not nested in offer object)
        return NextResponse.json({
            success: true,
            token: offer.token,  // Direct token access
            expiresAt: offer.expiresAt,
            offerId: offer._id   // Optional: also include offer ID if needed
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to send offer" }, { status: 500 });
    }
}