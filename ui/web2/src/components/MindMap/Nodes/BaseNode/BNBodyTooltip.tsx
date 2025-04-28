import type React from "react";
import { forwardRef, useContext } from "react";
import { BaseNodeContext } from "./context";
import { LabeledIcon } from "./LabeledIcon";
import { CornersIn, CornersOut, Trash } from "@phosphor-icons/react";

export type BNBodyTooltipType = {
    icon: React.ReactElement;
    iconAfter?: React.ReactElement;
    label?: string;
    forceVisible?: boolean;
    onClick: (event: React.MouseEvent) => void;
};

export type BNBodyTooltipProps = {
    tools?: BNBodyTooltipType[];
    enableExpand?: boolean;
    enableDelete?: boolean;
    nodeId?: string;
    onDelete?: (id: string) => void;
};

export const BNBodyTooltip = forwardRef<HTMLDivElement, BNBodyTooltipProps>(
    ({ tools, enableExpand, enableDelete, nodeId, onDelete, ...props }, ref) => {
        const { showTooltip, hideTooltip, isDetailExpanded, setIsDetailExpanded } =
            useContext(BaseNodeContext);

        return (
            <div ref={ref} {...props}>
                <div className="flex flex-col items-center justify-between flex-1 right-0 min-h-[72px] h-full">
                    {enableExpand && (
                        <LabeledIcon
                            key={0}
                            icon={
                                isDetailExpanded ? (
                                    <CornersIn className="text-gray-400 hover:text-gray-600" />
                                ) : (
                                    <CornersOut className="text-gray-400 hover:text-gray-600" />
                                )
                            }
                            label={isDetailExpanded ? "Collapse" : "Expand"}
                            forceVisible={true}
                            onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                setIsDetailExpanded(!isDetailExpanded);
                            }}
                            onMouseEnter={showTooltip}
                            onMouseLeave={hideTooltip}
                        />
                    )}
                    {enableDelete && onDelete && (
                        <LabeledIcon
                            key={1}
                            icon={
                                <Trash className="text-gray-400 hover:text-red-600" />
                            }
                            label={"Delete"}
                            forceVisible={false}
                            onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                if (nodeId) {
                                    onDelete(nodeId);
                                }
                            }}
                            onMouseEnter={showTooltip}
                            onMouseLeave={hideTooltip}
                        />
                    )}
                    {tools &&
                        tools.length > 0 &&
                        tools.map((tool, index) => (
                            <LabeledIcon
                                key={tool.label || tool.iconAfter?.toString() || index}
                                icon={tool.icon}
                                label={tool.label}
                                forceVisible={tool.forceVisible ?? false}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    tool.onClick(event);
                                }}
                                onMouseEnter={showTooltip}
                                onMouseLeave={hideTooltip}
                            />
                        ))}
                </div>
            </div>
        );
    }
);

BNBodyTooltip.displayName = "BNBodyTooltip"; 