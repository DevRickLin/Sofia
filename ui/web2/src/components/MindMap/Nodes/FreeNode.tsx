import { memo, useState } from "react";
import { BaseNode, BNBody, BNBodyContent, BNBodyTooltip, BNHandle } from "./BaseNode";
import type { BNBodyTooltipType } from "./BaseNode";
import type { ColorPattern } from "./type";
import type { NodeProps } from "@xyflow/react";
import { getColor } from "./utils";
import { useCanvasStore } from '../../../store/canvasStore';

export interface FreeNodeData extends Record<string, unknown> {
    content: string;
    onDelete?: (id: string) => void;
    onSelect?: () => void;
}

export const FreeNode = memo((props: NodeProps) => {
    const { data, id } = props;
    const colors: ColorPattern = getColor("gray");
    const nodeData = data as FreeNodeData;
    const setFreeNodeId = useCanvasStore(s => s.setFreeNodeId);

    // 挂载时自动设置 freeNodeId
    useState(() => {
        setFreeNodeId(id);
    });

    const tools: BNBodyTooltipType[] = [
        {
            icon: <></>,
            label: "Delete",
            forceVisible: false,
            onClick: () => nodeData.onDelete?.(id),
        },
    ];

    const handleActivate = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFreeNodeId(id);
        nodeData.onSelect?.();
        if (typeof window !== 'undefined') {
            (window as Window & { __fromFreeNode?: boolean }).__fromFreeNode = true;
        }
    };

    return (
        <BaseNode colors={colors} selected={true}>
            <BNBody>
                <BNBodyContent>
                    <button 
                        className="flex flex-col w-full items-center cursor-pointer bg-transparent border-0 p-0 m-0"
                        onClick={handleActivate}
                        aria-label="Open sidebar to ask a question"
                        type="button"
                    >
                        <div className="p-[2px] w-full">
                            <div className="text-sm text-gray-600 text-center font-bold">
                                {nodeData.content || "Ask a new question"}
                            </div>
                            <div className="text-xs text-gray-400 text-center mt-1">
                                click to add more questions in the same canvas
                            </div>
                        </div>
                    </button>
                </BNBodyContent>
                <BNBodyTooltip enableDelete tools={tools} />
            </BNBody>
            <BNHandle colors={colors} enableSourceHandle enableTargetHandle />
        </BaseNode>
    );
}); 