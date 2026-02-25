import { NextRequest, NextResponse } from "next/server";
import { syncOfferLetterStatus } from "@/lib/offerSync";

export async function POST(request: NextRequest) {
    try {
        const result = await syncOfferLetterStatus();
        
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Error in offer letter sync:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const result = await syncOfferLetterStatus();
        
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Error in offer letter sync:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
