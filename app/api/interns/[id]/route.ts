import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Intern, InternProfile } from "@/models/intern";
import { createAuditLog, detectChanges, generateChangeDescription, getAuthUser } from "@/lib/auditLogger";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const body = await request.json();
        const { id } = await params;
        const performedBy = getAuthUser(request);

        console.log('PUT request received:', { id, body });

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Intern ID is required" },
                { status: 400 }
            );
        }

        // Find the intern
        const intern = await Intern.findById(id);
        if (!intern) {
            return NextResponse.json(
                { success: false, error: "Intern not found" },
                { status: 404 }
            );
        }

        // Find the intern profile
        const internProfile = await InternProfile.findOne({ internId: id });
        if (!internProfile) {
            return NextResponse.json(
                { success: false, error: "Intern profile not found" },
                { status: 404 }
            );
        }

        // Store original data for audit logging
        const originalInternData = intern.toObject();
        const originalProfileData = internProfile.toObject();

        // Update intern basic data
        const { fullName, email, mobile, collegeName, degree, branch, yearOfStudy, cityState, address } = body;
        
        if (fullName) intern.fullName = fullName;
        if (email) intern.email = email;
        if (mobile !== undefined) intern.mobile = mobile;
        if (collegeName !== undefined) intern.collegeName = collegeName;
        if (degree !== undefined) intern.degree = degree;
        if (branch !== undefined) intern.branch = branch;
        if (yearOfStudy !== undefined) intern.yearOfStudy = yearOfStudy;
        if (cityState !== undefined) intern.cityState = cityState;
        if (address !== undefined) intern.address = address;

        await intern.save();

        // Log intern changes
        const internChanges = detectChanges(originalInternData, intern.toObject());
        if (Object.keys(internChanges).length > 0) {
            await createAuditLog({
                entityType: 'intern',
                entityId: id,
                action: 'update',
                changes: internChanges,
                performedBy,
                description: generateChangeDescription(internChanges, intern.fullName),
                request
            });
        }

        // Update intern profile data
        const {
            preferredDomain, skillLevel, technicalSkills, priorExperience, portfolioUrl,
            offerStatus, internshipStatus, internshipFeePaid, offerLetterIssued,
            certificateIssued, notes
        } = body;

        if (preferredDomain !== undefined) internProfile.preferredDomain = preferredDomain;
        if (skillLevel !== undefined) internProfile.skillLevel = skillLevel;
        if (technicalSkills !== undefined) internProfile.technicalSkills = technicalSkills;
        if (priorExperience !== undefined) internProfile.priorExperience = priorExperience;
        if (portfolioUrl !== undefined) internProfile.portfolioUrl = portfolioUrl;
        if (offerStatus !== undefined) internProfile.offerStatus = offerStatus;
        if (internshipStatus !== undefined) internProfile.internshipStatus = internshipStatus;
        if (internshipFeePaid !== undefined) internProfile.internshipFeePaid = internshipFeePaid;
        if (offerLetterIssued !== undefined) internProfile.offerLetterIssued = offerLetterIssued;
        if (certificateIssued !== undefined) internProfile.certificateIssued = certificateIssued;
        if (notes !== undefined) internProfile.notes = notes;

        await internProfile.save();

        // Log intern profile changes
        const profileChanges = detectChanges(originalProfileData, internProfile.toObject());
        if (Object.keys(profileChanges).length > 0) {
            await createAuditLog({
                entityType: 'intern_profile',
                entityId: internProfile._id.toString(),
                action: 'update',
                changes: profileChanges,
                performedBy,
                description: generateChangeDescription(profileChanges, intern.fullName),
                request
            });
        }

        console.log('Intern updated successfully');

        return NextResponse.json({
            success: true,
            message: "Intern updated successfully"
        });

    } catch (error: any) {
        console.error("Error updating intern:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
