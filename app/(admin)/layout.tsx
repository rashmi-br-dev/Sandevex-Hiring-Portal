"use client";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import LogoutButton from "@/components/logout-button";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isGoogleFormOpen, setIsGoogleFormOpen] = useState(false);

    return (
        <div className="flex h-screen bg-white dark:bg-black text-foreground overflow-hidden">

            {/* Sidebar - Vercel style - Fixed */}
            <aside className="w-64 border-r border-black/10 dark:border-white/10 bg-white dark:bg-black flex-shrink-0 h-screen overflow-y-auto">
                <div className="p-6 space-y-8">

                    <div className="relative h-9 w-full overflow-hidden flex items-center justify-start pl-2">
                        <Image
                            src="/1.svg"
                            alt="Sandevex"
                            width={200}
                            height={120}
                            className="object-contain"
                            priority
                        />
                    </div>


                    <nav className="space-y-1">
                        <Link
                            href="/dashboard"
                            className="flex items-center px-3 py-2 text-sm font-medium text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            Dashboard
                        </Link>

                        <Link
                            href="/internship-offer"
                            className="flex items-center px-3 py-2 text-sm font-medium text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            Offers
                        </Link>

                        {/* <Link
                            href="/candidates"
                            className="flex items-center px-3 py-2 text-sm font-medium text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            Candidates
                        </Link> */}

                        {/* Google Form Data Dropdown */}
                        <div>
                            <button
                                onClick={() => setIsGoogleFormOpen(!isGoogleFormOpen)}
                                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            >
                                <span>Google Form Data</span>
                                {isGoogleFormOpen ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </button>
                            
                            {isGoogleFormOpen && (
                                <div className="ml-4 mt-1 space-y-1">
                                    <Link
                                        href="/candidates"
                                        className="flex items-center px-3 py-2 text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                    >
                                        Candidates
                                    </Link>
                                    <Link
                                        href="/domain-preferences"
                                        className="flex items-center px-3 py-2 text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                    >
                                        Domain Preference
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="pt-8 mt-8 border-t border-black/10 dark:border-white/10">
                            <LogoutButton />
                        </div>
                    </nav>
                </div>
            </aside>

            {/* Main Content - Fixed header, scrollable content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">

                {/* Header - Vercel style - Fixed */}
                <header className="h-14 border-b border-black/10 dark:border-white/10 bg-white dark:bg-black flex items-center justify-between px-6 flex-shrink-0">
                    <h2 className="text-sm font-medium text-black/60 dark:text-white/60">
                        
                    </h2>
                    <ThemeToggle />
                </header>

                {/* Main Area - Vercel style - Scrollable */}
                <main className="flex-1 bg-[#fafafa] dark:bg-[#111] overflow-y-auto">
                    <div className="p-3">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </div>
                </main>

            </div>
        </div>
    );
}