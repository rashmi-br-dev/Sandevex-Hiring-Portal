import Offer from "@/models/Offer";

export async function expireOldOffers(candidateId: string) {
    const now = new Date();

    await Offer.updateMany(
        {
            candidateId,
            status: "pending",
            expiresAt: { $lt: now }
        },
        { status: "expired" }
    );
}
