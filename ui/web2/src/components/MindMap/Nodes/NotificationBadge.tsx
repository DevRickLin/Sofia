import { Bell, Check, SpinnerGap } from "@phosphor-icons/react";
import { useState, useCallback } from "react";
import type { NotificationStatus } from "../types";

interface NotificationBadgeProps {
    status: NotificationStatus;
    onClick: () => Promise<void>;
    size?: number;
}

export const NotificationBadge = ({ status, onClick, size = 16 }: NotificationBadgeProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = useCallback(async (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        e.preventDefault();
        await onClick();
    }, [onClick]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleClick(e);
        }
    }, [handleClick]);

    const renderIcon = () => {
        switch (status) {
            case 'loading':
                return (
                    <SpinnerGap
                        size={size}
                        className="text-gray-600 animate-spin"
                        weight="bold"
                    />
                );
            case 'completed':
                return (
                    <Check
                        size={size}
                        className="text-emerald-600"
                        weight="bold"
                    />
                );
            default:
                return (
                    <Bell
                        size={size}
                        className={`text-gray-500 transition-colors duration-200 ${
                            isHovered ? "text-gray-700" : ""
                        }`}
                        weight="bold"
                    />
                );
        }
    };

    return (
        <button
            type="button"
            className="cursor-pointer focus:outline-none rounded-sm p-0.5"
            onClick={handleClick}
            onKeyPress={handleKeyPress}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {renderIcon()}
        </button>
    );
}; 