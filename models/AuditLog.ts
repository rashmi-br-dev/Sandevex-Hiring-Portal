import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
    entityType: 'intern' | 'intern_profile';
    entityId: mongoose.Types.ObjectId;
    action: 'create' | 'update' | 'delete';
    changes: Record<string, { from: any; to: any }>;
    performedBy?: string; // User ID or email
    performedAt: Date;
    ipAddress?: string;
    userAgent?: string;
    description?: string;
}

const AuditLogSchema = new Schema<IAuditLog>({
    entityType: {
        type: String,
        enum: ['intern', 'intern_profile'],
        required: true
    },
    entityId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'entityType'
    },
    action: {
        type: String,
        enum: ['create', 'update', 'delete'],
        required: true
    },
    changes: {
        type: Map,
        of: {
            from: Schema.Types.Mixed,
            to: Schema.Types.Mixed
        },
        default: new Map()
    },
    performedBy: {
        type: String,
        required: false
    },
    performedAt: {
        type: Date,
        default: Date.now
    },
    ipAddress: {
        type: String,
        required: false
    },
    userAgent: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

// Indexes for faster querying
AuditLogSchema.index({ entityType: 1, entityId: 1, performedAt: -1 });
AuditLogSchema.index({ performedAt: -1 });
AuditLogSchema.index({ performedBy: 1, performedAt: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
