import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Offer from "@/models/Offer";
import Student from "@/models/Student";
import crypto from "crypto";

export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";
        const skip = (page - 1) * limit;

        console.log("Fetching offers with params:", { page, limit, search, status });

        // Build query
        let query: any = {};

        // Search by email or candidate name
        if (search) {
            // First find students matching the search
            const students = await Student.find({
                $or: [
                    { fullName: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { collegeName: { $regex: search, $options: "i" } }
                ]
            }).select('_id');

            const studentIds = students.map(s => s._id);
            
            query.$or = [
                { email: { $regex: search, $options: "i" } },
                { candidateId: { $in: studentIds } }
            ];
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        console.log("Query:", JSON.stringify(query));

        // Get total count
        const total = await Offer.countDocuments(query);

        // Get offers with pagination
        const offers = await Offer.find(query)
            .populate({
                path: 'candidateId',
                model: Student,
                select: 'fullName collegeName email mobile'
            })
            .sort({ sentAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        console.log(`Found ${offers.length} offers`);

        // Log first offer to check population
        if (offers.length > 0) {
            console.log("Sample offer:", {
                id: offers[0]._id,
                status: offers[0].status,
                candidate: offers[0].candidateId
            });
        }

        return NextResponse.json({
            offers,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching offers:", error);
        return NextResponse.json(
            { error: "Failed to fetch offers: " + (error as Error).message },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        
        const { candidateId, email } = await req.json();

        if (!candidateId || !email) {
            return NextResponse.json(
                { error: "Candidate ID and email are required" },
                { status: 400 }
            );
        }

        // Check if candidate exists
        const candidate = await Student.findById(candidateId);
        if (!candidate) {
            return NextResponse.json(
                { error: "Candidate not found" },
                { status: 404 }
            );
        }

        // Check for existing pending offer
        const existingOffer = await Offer.findOne({
            candidateId,
            status: 'pending'
        });

        if (existingOffer) {
            return NextResponse.json(
                { error: "Candidate already has a pending offer" },
                { status: 400 }
            );
        }

        // Generate unique token
        const token = crypto.randomBytes(32).toString("hex");
        
        // Set expiration (24 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Create offer
        const offer = await Offer.create({
            candidateId,
            email,
            token,
            status: 'pending',
            sentAt: new Date(),
            expiresAt
        });

        const populatedOffer = await Offer.findById(offer._id).populate(
            'candidateId',
            'fullName collegeName email mobile'
        );

        return NextResponse.json({
            success: true,
            offer: populatedOffer
        });
    } catch (error) {
        console.error("Error creating offer:", error);
        return NextResponse.json(
            { error: "Failed to create offer: " + (error as Error).message },
            { status: 500 }
        );
    }
}