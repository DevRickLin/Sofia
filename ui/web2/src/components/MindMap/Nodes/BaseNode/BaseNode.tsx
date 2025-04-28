import React, {
    useState,
    useRef,
    useCallback,
    forwardRef,
    HTMLAttributes,
    useEffect,
} from "react";
import { ColorPattern } from "../type";
import { BaseNodeContext } from "./context";
import "./style.css";

export type BaseNodeProps = HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
    colors: ColorPattern;
    selected?: boolean;
    initialExpanded?: boolean;
};

export const BaseNode = forwardRef<HTMLDivElement, BaseNodeProps>(
    ({ children, colors, selected, initialExpanded = false, ...props }, ref) => {
        const [isTooltipVisible, setTooltipVisible] = useState(false);
        const [isExpanded, setIsExpanded] = useState(initialExpanded);
        const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        
        // Update internal expanded state when props change
        useEffect(() => {
            setIsExpanded(initialExpanded);
        }, [initialExpanded]);
        
        const showTooltip = useCallback(() => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
            setTooltipVisible(true);
        }, []);

        const hideTooltip = useCallback(() => {
            hideTimeoutRef.current = setTimeout(() => {
                setTooltipVisible(false);
            }, 200); // delay in ms
        }, []);

        const animationSpeed = 6; // Default animation speed in seconds
        const animationColors = [
            "#40ffaa",
            "#4079ff",
            "#40ffaa",
            "#4079ff",
            "#40ffaa",
        ]; // Default colors

        return (
            <BaseNodeContext.Provider
                value={{
                    isTooltipVisible,
                    showTooltip,
                    hideTooltip,
                    isExpanded,
                    setIsExpanded,
                }}
            >
                <div
                    ref={ref}
                    className={`py-3 pl-4 pr-2 rounded-3xl shadow-md w-[256px] border-3`}
                    style={{
                        boxShadow: "0 2px 8px 2px rgba(0, 0, 0, 0.1)",
                        backgroundColor: colors.light_background,
                        borderColor: colors.light_background,
                    }}
                    onMouseEnter={showTooltip}
                    onMouseLeave={hideTooltip}
                    onFocus={showTooltip}
                    onBlur={hideTooltip}
                    onPointerDown={hideTooltip} // Hide tooltip when drag starts
                    data-expanded={isExpanded}
                >
                    {selected && (
                        <div
                            className={`gradient-overlay`}
                            style={{
                                backgroundImage: `linear-gradient(to right, ${animationColors.join(
                                    ", "
                                )})`,
                                animationDuration: `${animationSpeed}s`,
                            }}
                        ></div>
                    )}
                    <div className="relative">{children}</div>
                </div>
            </BaseNodeContext.Provider>
        );
    }
);

BaseNode.displayName = "BaseNode";
