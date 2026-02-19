"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function RespondPage() {
    const { token } = useParams();
    const search = useSearchParams();
    const action = search.get("action");

    const [status, setStatus] = useState<"loading" | "accepted" | "declined" | "error">("loading");

    useEffect(() => {
        async function respond() {
            try {
                const res = await fetch("/api/offers/respond", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, action })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                setStatus(data.status);
            } catch {
                setStatus("error");
            }
        }

        respond();
    }, [token, action]);

    const closeWindow = () => {
        window.open("", "_self");
        window.close();
    };

    const statusUI = {
        loading: {
            icon: "⏳",
            title: "Processing your response...",
            message: "Please wait while we confirm your decision."
        },
        accepted: {
            icon: "🎉",
            title: "Offer Accepted",
            message: "Welcome to Sandevex! We're excited to have you onboard."
        },
        declined: {
            icon: "🙂",
            title: "Response Received",
            message: "We respect your decision and wish you success in your career."
        },
        error: {
            icon: "⚠️",
            title: "Invalid or Expired Link",
            message: "This offer link is no longer valid or already used."
        }
    }[status];

    return (
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4">

            <div className="bg-white w-full max-w-md rounded-2xl shadow-lg border border-gray-200">

                {/* Logo */}
                <div className="border-b border-gray-200 h-24 overflow-hidden flex items-center justify-center px-6">
                    <img
                        src="/1.svg"
                        alt="Sandevex Logo"
                        className="h-30 w-auto object-cover scale-150"
                    />
                </div>

                {/* Content */}
                <div className="p-8 text-center space-y-5">

                    <div className="text-5xl">{statusUI.icon}</div>

                    <h1 className="text-xl font-semibold text-gray-900">
                        {statusUI.title}
                    </h1>

                    <p className="text-gray-600 text-sm leading-relaxed">
                        {statusUI.message}
                    </p>

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-4" />

                    {/* Close Button */}
                    <button
                        onClick={closeWindow}
                        className="w-full bg-black text-white py-2.5 rounded-lg hover:bg-gray-800 transition font-medium"
                    >
                        Close Window
                    </button>

                </div>
            </div>
        </div>
    );
}
