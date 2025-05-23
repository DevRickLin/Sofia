import React from "react";
import { Plus, Minus, CaretUp, CaretDown } from "@phosphor-icons/react";

interface BNExpandButtonProps {
    isExpanded: boolean;
    onClick: (event: React.MouseEvent) => void;
    position?: "bottom" | "right";
    className?: string;
    useCaretIcons?: boolean;
}

export const BNExpandButton: React.FC<BNExpandButtonProps> = ({
    isExpanded,
    onClick,
    position = "bottom",
    className = "",
    useCaretIcons = false,
}) => {
    const positionClasses = position === "bottom" 
        ? "absolute left-1/2 -translate-x-1/2 mt-2" 
        : "absolute top-1/2 -translate-y-1/2 mr-2 right-0";

    return (
        <div
            className={`flex items-center justify-center ${positionClasses} ${className}`}
            onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                onClick(event);
            }}
            data-testid="node-expand-button"
        >
            <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center cursor-pointer transition-colors duration-200 shadow-sm">
                {isExpanded ? (
                    useCaretIcons ? (
                        <CaretUp
                            weight="bold"
                            size={12}
                            className="text-gray-500 dark:text-gray-400"
                        />
                    ) : (
                        <Minus
                            weight="bold"
                            size={12}
                            className="text-gray-500 dark:text-gray-400"
                        />
                    )
                ) : (
                    useCaretIcons ? (
                        <CaretDown
                            weight="bold"
                            size={12}
                            className="text-gray-500 dark:text-gray-400"
                        />
                    ) : (
                        <Plus
                            weight="bold"
                            size={12}
                            className="text-gray-500 dark:text-gray-400"
                        />
                    )
                )}
            </div>
        </div>
    );
}; 