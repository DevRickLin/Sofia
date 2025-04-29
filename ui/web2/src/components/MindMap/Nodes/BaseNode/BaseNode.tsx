import type React from "react";
import { useState, useRef, useCallback, forwardRef } from "react";
import type { HTMLAttributes } from "react";
import type { ColorPattern } from "../type";
import { BaseNodeContext } from "./context";
import "./style.css";
import ContextMenu, { type ContextMenuItem } from "./ContextMenu";

export type BaseNodeProps = HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
    colors: ColorPattern;
    selected?: boolean;
    nodeId?: string;
    expandNode?: (nodeId: string) => void;
    toggleDetailExpanded?: (nodeId: string, isExpanded: boolean) => void;
    onDelete?: (nodeId: string) => void;
    isDetailExpanded?: boolean;
    isChildrenExpanded?: boolean;
    onNodeContextMenu?: (info: { x: number; y: number; nodeId: string }) => void;
};

export const BaseNode = forwardRef<HTMLDivElement, BaseNodeProps>(
    (
        {
            children,
            colors,
            selected,
            nodeId,
            expandNode,
            toggleDetailExpanded,
            onDelete,
            isDetailExpanded = false,
            isChildrenExpanded = false,
            onNodeContextMenu,
            ...rest
        },
        ref
    ) => {
        const [isTooltipVisible, setTooltipVisible] = useState(false);
        const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        const [contextMenu, setContextMenu] = useState<{
            x: number;
            y: number;
        } | null>(null);
        
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
                    setIsDetailExpanded: () => {
                        if (toggleDetailExpanded && nodeId) toggleDetailExpanded(nodeId, true);
                    },
                    isChildrenExpanded,
                    setIsChildrenExpanded: () => {},
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
                    onContextMenu={e => {
                        e.preventDefault();
                        console.log('节点右键', e.clientX, e.clientY);
                        if (typeof onNodeContextMenu === 'function' && nodeId) {
                            onNodeContextMenu({ x: e.clientX, y: e.clientY, nodeId });
                        } else {
                            setContextMenu({ x: e.clientX, y: e.clientY });
                        }
                    }}
                    {...rest}
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
                    {contextMenu && (
                        <ContextMenu
                            x={contextMenu.x}
                            y={contextMenu.y}
                            onClose={() => setContextMenu(null)}
                            items={[
                                toggleDetailExpanded && nodeId
                                    ? {
                                        label: isDetailExpanded ? "收起详细信息" : "展开详细信息",
                                        onClick: () => toggleDetailExpanded(nodeId, !isDetailExpanded),
                                    }
                                    : null,
                                expandNode && nodeId
                                    ? {
                                        label: isChildrenExpanded ? "收起子节点" : "展开子节点",
                                        onClick: () => expandNode(nodeId),
                                    }
                                    : null,
                                onDelete && nodeId
                                    ? {
                                        label: "删除节点",
                                        onClick: () => onDelete(nodeId),
                                    }
                                    : null,
                            ].filter(Boolean) as ContextMenuItem[]}
                        />
                    )}
                </div>
            </BaseNodeContext.Provider>
        );
    }
);

BaseNode.displayName = "BaseNode";
