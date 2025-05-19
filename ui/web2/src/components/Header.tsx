import type React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar as Menu,
    X,
    Export as Share2,
    User,
    EnvelopeSimple,
    SignOut,
    Gear,
    Target,
    UsersThree,
} from "@phosphor-icons/react";
import SofiaLogo from "../../imgs/sofia_logo.png";
import { useAutoFocus } from "../context/AutoFocusContext";
import InviteCollaboratorModal from "./InviteCollaboratorModal";

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showShareError, setShowShareError] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteStatus, setInviteStatus] = useState<null | "success" | "error" | "sending">(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const { isAutoFocusEnabled, toggleAutoFocus } = useAutoFocus();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfile(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        <header className="bg-white shadow-sm relative">
            {showShareError && (
                <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center py-2 px-4 text-sm">
                    Unable to share. Try copying the URL manually.
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex-none">
                        <div className="flex items-center">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="flex items-center"
                            >
                                <img
                                    src={SofiaLogo}
                                    alt="Sofia Logo"
                                    className="h-8 w-auto"
                                />
                            </motion.div>
                        </div>
                    </div>

                    <div className="flex-1" />

                    <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                        <button
                            type="button"
                            onClick={toggleAutoFocus}
                            className={`p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                                isAutoFocusEnabled ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                            aria-label="Toggle auto focus"
                            title={`${isAutoFocusEnabled ? 'Disable' : 'Enable'} auto focus`}
                        >
                            <Target className="h-5 w-5" />
                        </button>

                        <button
                            type="button"
                            onClick={handleShare}
                            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            aria-label="Share"
                        >
                            <Share2 className="h-5 w-5" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowInviteModal(true)}
                            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            aria-label="Invite Collaborator"
                            title="Invite Collaborator"
                        >
                            <UsersThree className="h-5 w-5" />
                        </button>

                        <div className="relative" ref={profileRef}>
                            <button
                                type="button"
                                onClick={() => setShowProfile(!showProfile)}
                                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                aria-label="User account"
                            >
                                <User className="h-5 w-5" />
                            </button>

                            <AnimatePresence>
                                {showProfile && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                                    >
                                        <div className="p-4 border-b border-gray-200">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex-shrink-0">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                                        <User weight="bold" className="w-5 h-5 text-emerald-600" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        Demo User
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        demo@example.com
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-2">
                                            <button
                                                type="button"
                                                onClick={() => console.log('Settings clicked')}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center space-x-2"
                                            >
                                                <Gear className="w-4 h-4" />
                                                <span>Settings</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => console.log('Support clicked')}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center space-x-2"
                                            >
                                                <EnvelopeSimple className="w-4 h-4" />
                                                <span>Support</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => console.log('Sign out clicked')}
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 rounded-md flex items-center space-x-2"
                                            >
                                                <SignOut className="w-4 h-4" />
                                                <span>Sign out</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="-mr-2 flex items-center sm:hidden">
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
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
                                type="button"
                                onClick={handleShare}
                                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 rounded-md"
                            >
                                <Share2 className="h-5 w-5 mr-3" />
                                Share
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowProfile(!showProfile)}
                                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 rounded-md"
                            >
                                <User className="h-5 w-5 mr-3" />
                                Account
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <InviteCollaboratorModal
                isOpen={showInviteModal}
                onClose={() => {
                    setShowInviteModal(false);
                    setInviteStatus(null);
                }}
                onInvite={async (email: string) => {
                    setInviteStatus("sending");
                    // TODO: 调用后端 API 发送邀请
                    // 这里用 setTimeout 模拟
                    await new Promise(r => setTimeout(r, 1200));
                    if (email?.includes("@")) {
                        setInviteStatus("success");
                    } else {
                        setInviteStatus("error");
                    }
                }}
                status={inviteStatus}
            />
        </header>
    );
};

export default Header;
