import AuditLog from "@/models/AuditLog";
import { NextRequest } from "next/server";

interface AuditLogData {
    entityType: 'intern' | 'intern_profile';
    entityId: string;
    action: 'create' | 'update' | 'delete';
    changes?: Record<string, { from: any; to: any }>;
    performedBy?: string;
    description?: string;
    request?: NextRequest;
}

export async function createAuditLog(data: AuditLogData) {
    try {
        const logData: any = {
            entityType: data.entityType,
            entityId: data.entityId,
            action: data.action,
            changes: data.changes || {},
            performedBy: data.performedBy || 'system',
            description: data.description,
            performedAt: new Date()
        };

        // Extract request metadata if available
        if (data.request) {
            logData.ipAddress = data.request.headers.get('x-forwarded-for') || 
                               data.request.headers.get('x-real-ip') || 
                               'unknown';
            logData.userAgent = data.request.headers.get('user-agent') || 'unknown';
        }

        await AuditLog.create(logData);
        console.log(`Audit log created: ${data.action} on ${data.entityType} ${data.entityId}`);
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw error to avoid breaking the main operation
    }
}

export function detectChanges(
    oldData: Record<string, any>, 
    newData: Record<string, any>
): Record<string, { from: any; to: any }> {
    const changes: Record<string, { from: any; to: any }> = {};

    // Fields to ignore in audit logs
    const ignoredFields = [
        '_id', '__v', 'createdAt', 'updatedAt', 
        'internId' // This is a reference field that shouldn't change
    ];

    for (const key in newData) {
        // Skip ignored fields and MongoDB internal fields
        if (ignoredFields.includes(key) || key.startsWith('_')) {
            continue;
        }

        const oldValue = oldData[key];
        const newValue = newData[key];

        // Deep comparison for arrays and objects
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes[key] = {
                from: oldValue,
                to: newValue
            };
        }
    }

    return changes;
}

export function generateChangeDescription(
    changes: Record<string, { from: any; to: any }>,
    entityName: string
): string {
    const changeDescriptions: string[] = [];

    for (const [field, change] of Object.entries(changes)) {
        const fieldName = field.replace(/([A-Z])/g, ' $1').trim(); // Convert camelCase to readable
        const fromValue = formatValue(change.from);
        const toValue = formatValue(change.to);

        if (field === 'internshipStatus') {
            changeDescriptions.push(`internship status from ${fromValue} to ${toValue}`);
        } else if (field === 'offerStatus') {
            changeDescriptions.push(`offer status from ${fromValue} to ${toValue}`);
        } else if (field === 'internshipFeePaid') {
            changeDescriptions.push(`internship fee payment to ${toValue}`);
        } else if (field === 'offerLetterIssued') {
            changeDescriptions.push(`offer letter issued to ${toValue}`);
        } else if (field === 'certificateIssued') {
            changeDescriptions.push(`certificate issued to ${toValue}`);
        } else {
            changeDescriptions.push(`${fieldName} from ${fromValue} to ${toValue}`);
        }
    }

    if (changeDescriptions.length === 0) {
        return `Updated ${entityName}`;
    }

    if (changeDescriptions.length === 1) {
        return `Updated ${entityName}: ${changeDescriptions[0]}`;
    }

    return `Updated ${entityName}: ${changeDescriptions.slice(0, 2).join(', ')}${changeDescriptions.length > 2 ? ` and ${changeDescriptions.length - 2} more` : ''}`;
}

function formatValue(value: any): string {
    if (value === null || value === undefined) {
        return 'empty';
    }
    if (Array.isArray(value)) {
        return value.length > 0 ? `${value.length} items` : 'empty';
    }
    if (typeof value === 'boolean') {
        return value ? 'yes' : 'no';
    }
    if (typeof value === 'object' && value instanceof Date) {
        return value.toLocaleDateString();
    }
    return String(value);
}

export function getAuthUser(request: NextRequest): string {
    // Try to get user from session, token, or other auth mechanism
    // This is a placeholder - implement based on your auth system
    const userEmail = request.headers.get('x-user-email') || 
                     request.cookies.get('user-email')?.value || 
                     'admin@sandevex.com';
    
    return userEmail;
}
