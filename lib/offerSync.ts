import { connectDB } from "@/lib/db";
import Offer from "@/models/Offer";
import { InternProfile } from "@/models/intern";

export async function syncOfferLetterStatus() {
    try {
        await connectDB();

        // Find all offers where physical letter is collected
        const offersWithPhysicalLetter = await Offer.find({
            physicalLetterCollected: true,
            status: 'accepted'
        });

        console.log(`Found ${offersWithPhysicalLetter.length} offers with physical letters collected`);

        for (const offer of offersWithPhysicalLetter) {
            // Find the corresponding intern profile
            const internProfile = await InternProfile.findOne({
                internId: offer.candidateId
            });

            if (internProfile) {
                // Update intern profile if offer letter issued is not already true
                if (!internProfile.offerLetterIssued) {
                    internProfile.offerLetterIssued = true;
                    internProfile.offerLetterIssuedAt = offer.updatedAt;
                    await internProfile.save();

                    console.log(`Updated intern profile for candidate ${offer.candidateId}: offer letter marked as issued`);
                }

                // Update offer status to accepted if not already
                if (offer.status !== 'accepted') {
                    offer.status = 'accepted';
                    await offer.save();
                    console.log(`Updated offer ${offer._id} status to accepted`);
                }
            }
        }

        return {
            success: true,
            message: `Synced ${offersWithPhysicalLetter.length} offers with physical letters`,
            updated: offersWithPhysicalLetter.length
        };

    } catch (error: any) {
        console.error("Error syncing offer letter status:", error);
        return {
            success: false,
            error: error.message
        };
    }
}
