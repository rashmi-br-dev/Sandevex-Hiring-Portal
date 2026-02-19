import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { fetchSheetData } from "@/lib/google";
import Student from "@/models/Student";

export async function POST() {
    try {
        await connectDB();

        const rows = await fetchSheetData();

        if (!rows || rows.length === 0) {
            return NextResponse.json({ message: "No data found" });
        }

        // Get all existing emails once (fast)
        const existingStudents = await Student.find({}, "email");
        const existingEmails = new Set(existingStudents.map((s) => s.email));

        let newStudents: any[] = [];

        for (const row of rows) {
            const email = row[2];
            if (!email) continue;

            await Student.updateOne(
                { email },
                {
                    $set: {
                        timestamp: row[0] ? new Date(row[0]) : undefined,
                        fullName: row[1],
                        mobile: row[3],
                        cityState: row[4],
                        address: row[5],
                        collegeName: row[6],
                        degree: row[7],
                        branch: row[8],
                        yearOfStudy: row[9],
                        preferredDomain: row[10],
                        technicalSkills: row[11]
                            ? row[11].split(",").map((s: string) => s.trim())
                            : [],
                        priorExperience: row[12],
                        portfolioUrl: row[13],
                        whySandevex: row[14],
                        declaration: row[15],
                    },
                },
                { upsert: true }
            );
        }


        if (newStudents.length > 0) {
            await Student.insertMany(newStudents);
        }

        return NextResponse.json({
            success: true,
            inserted: newStudents.length,
            totalSheetRows: rows.length,
        });

    } catch (error) {
        console.error("SYNC ERROR:", error);
        return NextResponse.json(
            { success: false, message: "Sync failed ❌" },
            { status: 500 }
        );
    }
}
