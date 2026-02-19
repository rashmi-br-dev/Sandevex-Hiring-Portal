import mongoose, { Document, Schema, model } from "mongoose";

export interface IStudent extends Document {
    fullName: string;
    email: string;
    mobile: string;
    cityState: string;
    address: string;
    collegeName: string;
    degree: string;
    branch: string;
    yearOfStudy: string;
    preferredDomain: string;
    technicalSkills: string[];
    priorExperience: string;
    portfolioUrl: string;
    whySandevex: string;
    declaration: string;
    assignmentSent: boolean;
    sentAt?: Date;
}

const StudentSchema = new Schema<IStudent>(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        mobile: { type: String, required: true },
        cityState: { type: String, required: true },
        address: { type: String, required: true },
        collegeName: { type: String, required: true },
        degree: { type: String, required: true },
        branch: { type: String, required: true },
        yearOfStudy: { type: String, required: true },
        preferredDomain: { type: String, required: true },
        technicalSkills: [String],
        priorExperience: { type: String, required: true },
        portfolioUrl: { type: String },
        whySandevex: { type: String, required: true },
        declaration: { type: String, required: true },

        assignmentSent: { type: Boolean, default: false },
        sentAt: Date,
    },
    { timestamps: true }
);

// Check if model exists before creating a new one
const Student = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);

export default Student;