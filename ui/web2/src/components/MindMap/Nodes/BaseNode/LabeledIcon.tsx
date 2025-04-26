import React, {
    useState,
    useRef,
    useCallback,
    useContext,
    useEffect,
} from "react";
import { BaseNodeContext } from "./context";

interface LabeledIconProps {
    icon: React.ReactElement;
    label?: string;
    forceVisible: boolean;
    onMouseEnter: (event: React.MouseEvent) => void;
    onMouseLeave: (event: React.MouseEvent) => void;
    onClick: (event: React.MouseEvent) => void;
}

export const LabeledIcon: React.FC<LabeledIconProps> = ({
    icon,
    label,
    forceVisible,
    onMouseEnter,
    onMouseLeave,
    onClick,
}) => {
    const { isTooltipVisible } = useContext(BaseNodeContext);
    const [isLabelVisible, setLabelVisible] = useState(false);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showLabel = useCallback(
        (event: React.MouseEvent) => {
            event.stopPropagation();
            event.preventDefault();
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
            setLabelVisible(true);
            onMouseEnter?.(event);
        },
        [onMouseEnter]
    );

    const hideLabel = useCallback(
        (event: React.MouseEvent) => {
            event.stopPropagation();
            event.preventDefault();
            hideTimeoutRef.current = setTimeout(() => {
                setLabelVisible(false);
            }, 200); // shorter delay is usually better for UX
            if (!isTooltipVisible) {
                onMouseLeave?.(event);
            }
        },
        [onMouseLeave]
    );

    useEffect(() => {
        if (!isTooltipVisible && !forceVisible && isLabelVisible) {
            setLabelVisible(false);
        }
    }, [isLabelVisible]);

    return (
        <div className="relative inline-flex items-center justify-center group cursor-pointer">
            <div
                className={`text-xl ${
                    isTooltipVisible || isLabelVisible || forceVisible
                        ? "opacity-90"
                        : "opacity-0"
                } hover:scale-125`}
                onMouseEnter={showLabel}
                onMouseLeave={hideLabel}
                onClick={onClick}
            >
                {icon}
            </div>

            {isLabelVisible && label && (
                <div
                    className={`
                        absolute left-full top-1/2 -translate-y-1/2 ml-4
                        bg-zinc-800 text-white text-sm px-2 py-1 rounded shadow-lg
                        transition-all duration-200 ease-in-out whitespace-nowrap
                    `}
                    onMouseEnter={showLabel}
                    onMouseLeave={hideLabel}
                >
                    {label}
                </div>
            )}
        </div>
    );
};
