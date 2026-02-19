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
                offerExpiresAt: offer.expiresAt
            });
        });

        // Combine student data with offer status
        const candidates = students.map(student => {
            const offer = offerMap.get(student._id.toString());
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
                offerStatus: offer?.offerStatus || 'not_sent',
                offerId: offer?.offerId,
                offerSentAt: offer?.offerSentAt,
                offerExpiresAt: offer?.offerExpiresAt
            };
        });

        return NextResponse.json({
            candidates,
            total: candidates.length
        });
    } catch (error) {
        console.error("Error fetching candidates with offer status:", error);
        return NextResponse.json(
            { error: "Failed to fetch candidates" },
            { status: 500 }
        );
    }
}