import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Student from "@/models/Student";

export async function GET() {
    try {
        await connectDB();
        
        // Get unique college names (case insensitive)
        const colleges = await Student.aggregate([
            {
                $match: {
                    collegeName: { $nin: [null, "", "undefined", "null"] }
                }
            },
            {
                $group: {
                    _id: { $toLower: "$collegeName" }, // Group by lowercase for case-insensitive
                    original: { $first: "$collegeName" } // Keep original case
                }
            },
            {
                $sort: { original: 1 }
            }
        ]);

        const collegeList = colleges.map(c => c.original);
        
        console.log("Colleges found:", collegeList);

        return NextResponse.json({ 
            colleges: collegeList,
            count: collegeList.length
        });
    } catch (error) {
        console.error("Error fetching colleges:", error);
        return NextResponse.json(
            { error: "Failed to fetch colleges" },
            { status: 500 }
        );
    }
}