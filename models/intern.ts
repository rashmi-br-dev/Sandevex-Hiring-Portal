import mongoose, { Schema, Document } from "mongoose";

// MAIN INTERN MODEL - Only basic personal details
export interface IIntern extends Document {
    // Personal Information (Basic)
    fullName: string;
    email: string;
    mobile?: string;

    // Academic Information (Basic)
    collegeName?: string;
    degree?: string;
    branch?: string;
    yearOfStudy?: string;

    // Location Details
    cityState?: string;
    address?: string;
}

const InternSchema = new Schema<IIntern>({
    // Personal Information
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String },

    // Academic Information
    collegeName: { type: String },
    degree: { type: String },
    branch: { type: String },
    yearOfStudy: { type: String },

    // Location Details
    cityState: { type: String },
    address: { type: String }

}, { timestamps: true });

// INTERN PROFILE MODEL - All status, tracking, and additional details
export interface IInternProfile extends Document {
    internId: mongoose.Types.ObjectId;

    // Core Reference
    preferredDomain?: string;

    // Skills & Experience
    skillLevel?: string;
    technicalSkills?: string[];
    priorExperience?: string;

    // Documents & Links
    portfolioUrl?: string;

    // Status Tracking
    offerStatus: "not_sent" | "sent" | "accepted" | "declined" | "expired";
    internshipStatus: "not_started" | "active" | "completed" | "terminated";

    // Payment Tracking
    internshipFeePaid: boolean;
    feePaidAt?: Date;

    // Offer Letter Tracking
    offerLetterIssued: boolean;
    offerLetterIssuedAt?: Date;
    offerLetterUrl?: string; // Optional: URL to stored offer letter

    // Certificate Tracking
    certificateIssued: boolean;
    certificateIssuedAt?: Date;
    certificateUrl?: string; // Optional: URL to stored certificate

    // Timeline Tracking
    joinedAt?: Date;
    completedAt?: Date;

    // Additional Notes
    notes?: string; // Optional: Any additional notes about the intern
}

const InternProfileSchema = new Schema<IInternProfile>({
    // Reference to main Intern
    internId: {
        type: Schema.Types.ObjectId,
        ref: "Intern",
        required: true,
        unique: true // One-to-one relationship
    },

    // Core Reference
    preferredDomain: { type: String },

    // Skills & Experience
    skillLevel: { type: String },
    technicalSkills: { type: [String], default: [] },
    priorExperience: { type: String },

    // Documents & Links
    portfolioUrl: { type: String },

    // Status Tracking (with defaults)
    offerStatus: {
        type: String,
        enum: ["not_sent", "sent", "accepted", "declined", "expired"],
        default: "not_sent"
    },
    internshipStatus: {
        type: String,
        enum: ["not_started", "active", "completed", "terminated"],
        default: "not_started"
    },

    // Payment Tracking
    internshipFeePaid: { type: Boolean, default: false },
    feePaidAt: { type: Date },

    // Offer Letter Tracking
    offerLetterIssued: { type: Boolean, default: false },
    offerLetterIssuedAt: { type: Date },
    offerLetterUrl: { type: String },

    // Certificate Tracking
    certificateIssued: { type: Boolean, default: false },
    certificateIssuedAt: { type: Date },
    certificateUrl: { type: String },

    // Timeline Tracking
    joinedAt: { type: Date },
    completedAt: { type: Date },

    // Additional Notes
    notes: { type: String }

}, { timestamps: true });

// Create indexes for better query performance
InternProfileSchema.index({ internId: 1 });
InternProfileSchema.index({ offerStatus: 1 });
InternProfileSchema.index({ internshipStatus: 1 });
InternProfileSchema.index({ internshipFeePaid: 1 });
InternProfileSchema.index({ offerLetterIssued: 1 });
InternProfileSchema.index({ certificateIssued: 1 });

export const Intern = mongoose.models.Intern || mongoose.model<IIntern>("Intern", InternSchema);
export const InternProfile = mongoose.models.InternProfile || mongoose.model<IInternProfile>("InternProfile", InternProfileSchema);