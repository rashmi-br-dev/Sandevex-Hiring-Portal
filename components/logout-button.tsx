"use client";

import { useRouter } from "next/navigation";
import { message } from "antd";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });

        message.success("Logged out");
        router.replace("/login");
        router.refresh();
    };

    return (
        <button
            onClick={handleLogout}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-md hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
        >
            Logout
        </button>
    );
}
