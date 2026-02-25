import { NextResponse } from "next/server";
import { importDomainApplications } from "@/scripts/importDomainApplications";

export async function POST() {
    try {
        console.log("Starting domain preferences sync...");
        const result = await importDomainApplications();
        
        console.log("Sync result:", result);
        
        return NextResponse.json({
            success: true,
            message: "Domain preferences synced successfully",
            imported: result?.imported || 0
        });
    } catch (error) {
        console.error("Error syncing domain preferences:", error);
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : "Failed to sync domain preferences" 
            },
            { status: 500 }
        );
    }
}
