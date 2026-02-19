import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Student from "@/models/Student";
import Offer from "@/models/Offer";

export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const getAll = searchParams.get("all") === "true";

        // Build student query
        let studentQuery: any = {};

        // Get ALL students (no pagination if all=true)
        const students = await Student.find(studentQuery)
            .sort({ createdAt: -1 })
            .lean();

        // Get all offers to map status
        const allOffers = await Offer.find({
            candidateId: { $in: students.map(s => s._id) }
        }).lean();

        // Create a map of candidateId -> offer details
        const offerMap = new Map();
        allOffers.forEach(offer => {
            offerMap.set(offer.candidateId.toString(), {
                offerStatus: offer.status,
                offerId: offer._id,
                offerSentAt: offer.sentAt,
                offerExpiresAt: offer.expiresAt,
                physicalLetterCollected: offer.physicalLetterCollected || false,
                respondedAt: offer.respondedAt
            });
        });

        // Combine student data with offer status
        const candidates = students.map(student => {
            const offer = offerMap.get(student._id.toString());

            // Only show physical letter status for accepted offers
            const physicalLetterCollected = offer?.offerStatus === 'accepted'
                ? offer?.physicalLetterCollected || false
                : undefined;

            return {
                _id: student._id,
                fullName: student.fullName,
                email: student.email,
                mobile: student.mobile,
                collegeName: student.collegeName,
                degree: student.degree,
                branch: student.branch,
                yearOfStudy: student.yearOfStudy,
                technicalSkills: student.technicalSkills,
                cityState: student.cityState,
                createdAt: student.createdAt,
                // Offer related fields
                offerStatus: offer?.offerStatus || 'not_sent',
                offerId: offer?.offerId,
                offerSentAt: offer?.offerSentAt,
                offerExpiresAt: offer?.offerExpiresAt,
                respondedAt: offer?.respondedAt,
                // Physical letter field - only relevant for accepted offers
                physicalLetterCollected: physicalLetterCollected
            };
        });

        return NextResponse.json({
            success: true,
            candidates,
            total: candidates.length,
            summary: {
                totalStudents: students.length,
                totalOffers: allOffers.length,
                acceptedOffers: allOffers.filter(o => o.status === 'accepted').length,
                pendingOffers: allOffers.filter(o => o.status === 'pending').length,
                declinedOffers: allOffers.filter(o => o.status === 'declined').length,
                expiredOffers: allOffers.filter(o => o.status === 'expired').length,
                physicalLettersCollected: allOffers.filter(o => o.physicalLetterCollected === true).length
            }
        });

    } catch (error) {
        console.error("Error fetching candidates with offer status:", error);
        return NextResponse.json(
            { error: "Failed to fetch candidates" },
            { status: 500 }
        );
    }
}