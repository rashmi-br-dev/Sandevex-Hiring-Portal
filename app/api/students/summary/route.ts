import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Student from "@/models/Student";

export async function GET() {
    try {
        await connectDB();

        // get ALL students (no pagination)
        const students = await Student.find({})
            .select(
                "fullName email collegeName preferredDomain yearOfStudy technicalSkills createdAt"
            )
            .lean();

        return NextResponse.json({
            success: true,
            students,
        });
    } catch (err) {
        console.error("Summary fetch error:", err);
        return NextResponse.json(
            { success: false, message: "Failed to fetch summary" },
            { status: 500 }
        );
    }
}
