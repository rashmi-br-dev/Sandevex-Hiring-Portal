import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Offer from "@/models/Offer";

export async function GET(req: Request) {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const offer = await Offer
        .findOne({ candidateId: id })
        .sort({ sentAt: -1 });

    if (!offer) return NextResponse.json({ status: "not-sent" });

    // AUTO EXPIRE HERE
    if (offer.status === "pending" && new Date() > offer.expiresAt) {
        offer.status = "expired";
        await offer.save();
    }

    return NextResponse.json({ status: offer.status });
}
