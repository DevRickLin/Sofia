import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import {
    Moon,
    Sun,
    Calendar as Menu,
    X,
    Export as Share2,
    User,
    ThreeD as MoreVertical,
} from "@phosphor-icons/react";

const Header: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showShareError, setShowShareError] = useState(false);

    const handleShare = async () => {
        try {
            if (!navigator.share) {
                throw new Error("Web Share API not supported");
            }

            await navigator.share({
                title: "Sofia - AI Breakthroughs Visualization",
                text: "Check out this interactive visualization of AI breakthroughs!",
                url: window.location.href,
            });
        } catch (error) {
            console.warn("Error sharing:", error);
            setShowShareError(true);
            setTimeout(() => setShowShareError(false), 3000);
        }
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm relative">
            {showShareError && (
                <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center py-2 px-4 text-sm">
                    Unable to share. Try copying the URL manually.
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="flex items-center"
                            >
                                <svg
                                    className="h-8 w-auto text-emerald-500"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M7 14s2 2 5 2 5-2 5-2M9 9h.01M15 9h.01"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                                    Sofia
                                </span>
                            </motion.div>
                        </div>
                    </div>

                    <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                        <button
                            onClick={handleShare}
                            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            aria-label="Share"
                        >
                            <Share2 className="h-5 w-5" />
                        </button>

                        <button
                            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            aria-label="User account"
                        >
                            <User className="h-5 w-5" />
                        </button>

                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? (
                                <Sun className="h-5 w-5" />
                            ) : (
                                <Moon className="h-5 w-5" />
                            )}
                        </button>

                        <button
                            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            aria-label="More options"
                        >
                            <MoreVertical className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="-mr-2 flex items-center sm:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
                        >
                            {isMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <div className="sm:hidden">
                    <div className="pt-2 pb-3 space-y-1">
                        <div className="px-4 py-2 space-y-1">
                            <button
                                onClick={handleShare}
                                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            >
                                <Share2 className="h-5 w-5 mr-3" />
                                Share
                            </button>
                            <button className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                                <User className="h-5 w-5 mr-3" />
                                Account
                            </button>
                            <button
                                onClick={toggleTheme}
                                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            >
                                {theme === "dark" ? (
                                    <>
                                        <Sun className="h-5 w-5 mr-3" />
                                        Light Mode
                                    </>
                                ) : (
                                    <>
                                        <Moon className="h-5 w-5 mr-3" />
                                        Dark Mode
                                    </>
                                )}
                            </button>
                            <button className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                                <MoreVertical className="h-5 w-5 mr-3" />
                                More Options
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
