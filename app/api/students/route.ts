import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Student from "@/models/Student";

export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);

        const search = searchParams.get("search") || "";
        const sort = searchParams.get("sort") || "new";
        const college = searchParams.get("college") || "";
        const page = Number(searchParams.get("page") || 1);
        const limit = Number(searchParams.get("limit") || 10);

        const skip = (page - 1) * limit;

        let query: any = {};

        // SEARCH
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { mobile: { $regex: search, $options: "i" } },
                { collegeName: { $regex: search, $options: "i" } },
            ];
        }

        // COLLEGE FILTER - exact match
        if (college) {
            query.collegeName = { $regex: `^${college}$`, $options: "i" };
        }

        // SORT
        const sortOption: Record<string, 1 | -1> = sort === "old" ? { createdAt: 1 } : { createdAt: -1 };

        const [students, total] = await Promise.all([
            Student.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean(),
            Student.countDocuments(query),
        ]);

        return NextResponse.json({
            students,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json(
            { error: "Failed to fetch students" },
            { status: 500 }
        );
    }
}