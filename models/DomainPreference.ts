import mongoose, { Document, Schema } from 'mongoose';

export interface IDomainPreference extends Document {
    timestamp: Date;
    fullName: string;
    email: string;
    contactNumber: string;
    collegeName: string;
    yearOfStudy: string;
    domain: string;
    skillLevel: string;
    interestReason: string;
    technologies: string[];
    emailAddress: string;
}

const DomainPreferenceSchema = new Schema<IDomainPreference>({
    timestamp: {
        type: Date,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        index: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    collegeName: {
        type: String,
        required: true
    },
    yearOfStudy: {
        type: String,
        required: true
    },
    domain: {
        type: String,
        required: true
    },
    skillLevel: {
        type: String,
        required: true
    },
    interestReason: {
        type: String,
        required: true
    },
    technologies: [{
        type: String
    }],
    emailAddress: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.models.DomainPreference || mongoose.model<IDomainPreference>('DomainPreference', DomainPreferenceSchema);
