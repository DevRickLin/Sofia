import type React from "react";
import { useState, useRef, useCallback, forwardRef, useEffect, type HTMLAttributes } from "react";
import type { ColorPattern } from "../type";
import { BaseNodeContext } from "./context";
import "./style.css";

export type BaseNodeProps = HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
    colors: ColorPattern;
    selected?: boolean;
    initialDetailExpanded?: boolean;
    initialChildrenExpanded?: boolean;
};

export const BaseNode = forwardRef<HTMLDivElement, BaseNodeProps>(
    (
        {
            children,
            colors,
            selected,
            initialDetailExpanded = false,
            initialChildrenExpanded = false
        },
        ref
    ) => {
        const [isTooltipVisible, setTooltipVisible] = useState(false);
        const [isDetailExpanded, setIsDetailExpanded] = useState(initialDetailExpanded);
        const [isChildrenExpanded, setIsChildrenExpanded] = useState(initialChildrenExpanded);
        const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        
        // Update internal expanded state when props change
        useEffect(() => {
            setIsDetailExpanded(initialDetailExpanded);
        }, [initialDetailExpanded]);
        useEffect(() => {
            setIsChildrenExpanded(initialChildrenExpanded);
        }, [initialChildrenExpanded]);
        
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
                    isDetailExpanded,
                    setIsDetailExpanded,
                    isChildrenExpanded,
                    setIsChildrenExpanded,
                }}
            >
                <div
                    ref={ref}
                    className={"py-3 pl-4 pr-2 rounded-3xl shadow-md w-[256px] border-3"}
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
                    data-detail-expanded={isDetailExpanded}
                    data-children-expanded={isChildrenExpanded}
                >
                    {selected && (
                        <div
                            className={"gradient-overlay"}
                            style={{
                                backgroundImage: `linear-gradient(to right, ${animationColors.join(", ")})`,
                                animationDuration: `${animationSpeed}s`,
                            }}
                        />
                    )}
                    <div className="relative">{children}</div>
                </div>
            </BaseNodeContext.Provider>
        );
    }
);

BaseNode.displayName = "BaseNode";
