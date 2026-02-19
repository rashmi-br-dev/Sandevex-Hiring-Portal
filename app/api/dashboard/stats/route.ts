import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Student from "@/models/Student";
import Offer from "@/models/Offer";

export async function GET() {
    try {
        await connectDB();

        // Get all students
        const students = await Student.find({}).lean();

        // Get all offers
        const offers = await Offer.find({}).populate('candidateId', 'fullName email collegeName').lean();

        // Student statistics
        const collegeCount: Record<string, number> = {};
        const skillCount: Record<string, number> = {};
        const domainCount: Record<string, number> = {};
        const yearCount: Record<string, number> = {};
        const dailyApps: Record<string, number> = {};

        let totalSkills = 0;
        let studentsWithSkills = 0;

        students.forEach(student => {
            // College counts
            if (student.collegeName) {
                collegeCount[student.collegeName] = (collegeCount[student.collegeName] || 0) + 1;
            }

            // Domain counts
            if (student.preferredDomain) {
                domainCount[student.preferredDomain] = (domainCount[student.preferredDomain] || 0) + 1;
            }

            // Year counts
            if (student.yearOfStudy) {
                yearCount[student.yearOfStudy] = (yearCount[student.yearOfStudy] || 0) + 1;
            }

            // Skill counts
            if (student.technicalSkills && Array.isArray(student.technicalSkills)) {
                studentsWithSkills++;
                totalSkills += student.technicalSkills.length;

                student.technicalSkills.forEach((skill: string) => {
                    if (skill && skill.trim()) {
                        skillCount[skill] = (skillCount[skill] || 0) + 1;
                    }
                });
            }

            // Daily applications
            if (student.createdAt) {
                const date = new Date(student.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
                dailyApps[date] = (dailyApps[date] || 0) + 1;
            }
        });

        // Offer statistics
        const offerCounts = {
            pending: 0,
            accepted: 0,
            declined: 0,
            expired: 0
        };

        const dailyOffers: Record<string, number> = {};
        const collegeAcceptance: Record<string, number> = {};

        offers.forEach(offer => {
            offerCounts[offer.status as keyof typeof offerCounts]++;

            // Daily offers
            if (offer.sentAt) {
                const date = new Date(offer.sentAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
                dailyOffers[date] = (dailyOffers[date] || 0) + 1;
            }

            // College acceptance counts
            if (offer.status === 'accepted' && offer.candidateId) {
                const student = offer.candidateId as any;
                if (student?.collegeName) {
                    collegeAcceptance[student.collegeName] = (collegeAcceptance[student.collegeName] || 0) + 1;
                }
            }
        });

        const totalOffers = offers.length;
        const studentsWithOffers = new Set(offers.map(o => o.candidateId?.toString())).size;
        const notSent = students.length - studentsWithOffers;

        // Recent students (last 5)
        const recentStudents = students.slice(0, 5).map(s => ({
            key: s._id,
            name: s.fullName,
            email: s.email,
            college: s.collegeName,
            skills: s.technicalSkills?.length || 0,
            applied: new Date(s.createdAt).toLocaleDateString()
        }));

        // Recent offers (last 5)
        const recentOffers = offers.slice(0, 5).map(o => ({
            key: o._id,
            name: (o.candidateId as any)?.fullName || 'Unknown',
            email: o.email,
            status: o.status,
            sentAt: o.sentAt
        }));

        return NextResponse.json({
            // Student stats
            totalStudents: students.length,
            uniqueColleges: Object.keys(collegeCount).length,
            uniqueSkills: Object.keys(skillCount).length,
            avgSkillsPerStudent: studentsWithSkills > 0 ? (totalSkills / studentsWithSkills).toFixed(1) : '0',
            totalSkillsMentioned: totalSkills,
            studentsWithSkills,

            collegeData: Object.entries(collegeCount)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value),

            skillData: Object.entries(skillCount)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 15),

            domainData: Object.entries(domainCount)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value),

            yearData: Object.entries(yearCount)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value),

            dailyApplications: Object.entries(dailyApps)
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),

            // Offer stats
            totalOffers,
            notSent,
            pending: offerCounts.pending,
            accepted: offerCounts.accepted,
            declined: offerCounts.declined,
            expired: offerCounts.expired,
            responseRate: (totalOffers - notSent) > 0
                ? Math.round(((offerCounts.accepted + offerCounts.declined) / (totalOffers - notSent)) * 100)
                : 0,

            dailyOffers: Object.entries(dailyOffers)
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),

            topCollegesByAcceptance: Object.entries(collegeAcceptance)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 10),

            // Recent data
            recentStudents,
            recentOffers
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard statistics" },
            { status: 500 }
        );
    }
}