import React, { forwardRef, useContext } from "react";
import { BaseNodeContext } from "./context";
import { LabeledIcon } from "./LabeledIcon";
import { CornersIn, CornersOut, ChatText, Trash } from "@phosphor-icons/react";

type BaseNodeBodyProps = {
    children: React.ReactNode;
    isExpanded?: boolean;
    isSelected?: boolean;
};

export const BNBody = forwardRef<HTMLDivElement, BaseNodeBodyProps>(
    ({ children, ...props }, ref) => {
        return (
            <div ref={ref} {...props} className={`flex h-full justify-between`}>
                {children}
            </div>
        );
    }
);

BNBody.displayName = "BNBody";

export const BNBodyContent = forwardRef<
    HTMLDivElement,
    { children: React.ReactNode }
>(({ children, ...props }, ref) => {
    return (
        <div
            ref={ref}
            {...props}
            className={`flex h-full justify-between w-[208px] pr-1`}
        >
            {children}
        </div>
    );
});

BNBodyContent.displayName = "BNBodyContent";

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
    enableChat?: boolean;
    enableDelete?: boolean;
    nodeId?: string;
    onDelete?: (id: string) => void;
};

export const BNBodyTooltip = forwardRef<HTMLDivElement, BNBodyTooltipProps>(
    ({ tools, enableExpand, enableChat, enableDelete, nodeId, onDelete, ...props }, ref) => {
        const { showTooltip, hideTooltip, isExpanded, setIsExpanded } =
            useContext(BaseNodeContext);

        return (
            <div ref={ref} {...props}>
                <div className="flex flex-col items-center justify-between flex-1 right-0 min-h-[72px] h-full">
                    {enableExpand && (
                        <LabeledIcon
                            key={0}
                            icon={
                                isExpanded ? (
                                    <CornersIn className="text-gray-400 hover:text-gray-600" />
                                ) : (
                                    <CornersOut className="text-gray-400 hover:text-gray-600" />
                                )
                            }
                            label={isExpanded ? "Collapse" : "Expand"}
                            forceVisible={true}
                            onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                setIsExpanded(!isExpanded);
                            }}
                            onMouseEnter={showTooltip}
                            onMouseLeave={hideTooltip}
                        />
                    )}
                    {enableDelete && (
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
                                console.log('Delete clicked for node:', nodeId);
                            }}
                            onMouseEnter={showTooltip}
                            onMouseLeave={hideTooltip}
                        />
                    )}
                    {tools &&
                        tools.length > 0 &&
                        tools.map((tool, index) => (
                            <LabeledIcon
                                key={index + 2}
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
                    {enableChat && (
                        <LabeledIcon
                            key={(tools?.length ?? 0) + 3}
                            icon={
                                <ChatText
                                    mirrored
                                    className="text-gray-400 hover:text-blue-600"
                                />
                            }
                            label="Chat"
                            forceVisible={false}
                            onClick={(_event) => {
                                console.log("Chat clicked");
                            }}
                            onMouseEnter={showTooltip}
                            onMouseLeave={hideTooltip}
                        />
                    )}
                </div>
            </div>
        );
    }
);

BNBodyTooltip.displayName = "BNBodyTooltip";
