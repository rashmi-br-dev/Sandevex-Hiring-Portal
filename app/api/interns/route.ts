import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Intern, InternProfile } from "@/models/intern";
import { createAuditLog, getAuthUser } from "@/lib/auditLogger";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        // Aggregate intern data with profile information
        const interns = await Intern.aggregate([
            {
                $lookup: {
                    from: "internprofiles",
                    localField: "_id",
                    foreignField: "internId",
                    as: "profile"
                }
            },
            {
                $unwind: {
                    path: "$profile",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    fullName: 1,
                    email: 1,
                    mobile: 1,
                    collegeName: 1,
                    degree: 1,
                    branch: 1,
                    yearOfStudy: 1,
                    cityState: 1,
                    address: 1,
                    preferredDomain: "$profile.preferredDomain",
                    skillLevel: "$profile.skillLevel",
                    technicalSkills: "$profile.technicalSkills",
                    priorExperience: "$profile.priorExperience",
                    portfolioUrl: "$profile.portfolioUrl",
                    offerStatus: "$profile.offerStatus",
                    internshipStatus: "$profile.internshipStatus",
                    internshipFeePaid: "$profile.internshipFeePaid",
                    feePaidAt: "$profile.feePaidAt",
                    offerLetterIssued: "$profile.offerLetterIssued",
                    offerLetterIssuedAt: "$profile.offerLetterIssuedAt",
                    offerLetterUrl: "$profile.offerLetterUrl",
                    certificateIssued: "$profile.certificateIssued",
                    certificateIssuedAt: "$profile.certificateIssuedAt",
                    certificateUrl: "$profile.certificateUrl",
                    joinedAt: "$profile.joinedAt",
                    completedAt: "$profile.completedAt",
                    notes: "$profile.notes",
                    createdAt: 1,
                    updatedAt: 1
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        return NextResponse.json({
            success: true,
            interns
        });

    } catch (error: any) {
        console.error("Error fetching interns:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const performedBy = getAuthUser(request);

        const { studentId, offerId, domainPreferenceId } = body;

        if (!studentId || !offerId || !domainPreferenceId) {
            return NextResponse.json(
                { success: false, error: "Student ID, Offer ID, and Domain Preference ID are required" },
                { status: 400 }
            );
        }

        // Get student details
        const studentRes = await fetch(`${request.nextUrl.origin}/api/candidates/with-offer-status`);
        const studentData = await studentRes.json();
        const student = studentData.candidates?.find((s: any) => s._id === studentId);

        if (!student) {
            return NextResponse.json(
                { success: false, error: "Student not found" },
                { status: 404 }
            );
        }

        // Get offer details
        const offerRes = await fetch(`${request.nextUrl.origin}/api/offers`);
        const offerData = await offerRes.json();
        const offer = offerData.offers?.find((o: any) => o._id === offerId);

        if (!offer) {
            return NextResponse.json(
                { success: false, error: "Offer not found" },
                { status: 404 }
            );
        }

        // Get domain preference details
        const domainRes = await fetch(`${request.nextUrl.origin}/api/domain-preferences?limit=1000`);
        const domainData = await domainRes.json();
        const domainPreference = domainData.data?.find((d: any) => d.email === student.email);

        if (!domainPreference) {
            return NextResponse.json(
                { success: false, error: "Domain preference not found" },
                { status: 404 }
            );
        }

        // Verify email and phone consistency
        if (student.email !== offer.email) {
            return NextResponse.json(
                { success: false, error: "Email mismatch between student and offer records" },
                { status: 400 }
            );
        }

        if (student.mobile && offer.mobile && student.mobile !== offer.mobile) {
            return NextResponse.json(
                { success: false, error: "Phone number mismatch between student and offer records" },
                { status: 400 }
            );
        }

        // Format name: convert to proper case (John Doe, John.Doe -> John Doe)
        const formatName = (name: string) => {
            return name
                .replace(/\./g, ' ') // Replace dots with spaces
                .split(/\s+/) // Split by spaces
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ') // Join with spaces
                .trim();
        };

        const formattedName = formatName(student.fullName);

        // Create intern record
        const intern = new Intern({
            fullName: formattedName,
            email: student.email,
            mobile: student.mobile,
            collegeName: student.collegeName,
            degree: student.degree,
            branch: student.branch,
            yearOfStudy: student.yearOfStudy,
            cityState: student.cityState,
            address: student.address
        });

        await intern.save();

        // Create intern profile record
        const internProfile = new InternProfile({
            internId: intern._id,
            preferredDomain: domainPreference.domain,
            skillLevel: domainPreference.skillLevel,
            technicalSkills: student.technicalSkills || [],
            priorExperience: student.priorExperience || '',
            portfolioUrl: domainPreference.portfolioUrl || '',
            offerStatus: offer.status === 'pending' ? 'not_sent' : 
                       offer.status === 'accepted' ? 'accepted' : 
                       offer.status === 'declined' ? 'declined' : 
                       offer.status === 'expired' ? 'expired' : 'not_sent',
            internshipStatus: 'active', // Automatically set to active when student becomes intern
            internshipFeePaid: false,
            offerLetterIssued: offer.physicalLetterCollected || false,
            certificateIssued: false,
            joinedAt: offer.status === 'accepted' ? new Date() : new Date(), // Set joined date when becoming intern
            notes: `Converted from student record on ${new Date().toLocaleDateString()}`
        });

        await internProfile.save();

        // Create audit logs
        await createAuditLog({
            entityType: 'intern',
            entityId: intern._id.toString(),
            action: 'create',
            performedBy,
            description: `Created intern from student ${student.fullName}`,
            request
        });

        await createAuditLog({
            entityType: 'intern_profile',
            entityId: internProfile._id.toString(),
            action: 'create',
            performedBy,
            description: `Created intern profile for ${intern.fullName}`,
            request
        });

        return NextResponse.json({
            success: true,
            intern: {
                ...intern.toObject(),
                profile: internProfile.toObject()
            }
        });

    } catch (error: any) {
        console.error("Error creating intern:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
