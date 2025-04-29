import { memo, useState } from "react";
import { BaseNode, BNBody, BNBodyContent, BNBodyTooltip, BNHandle } from "./BaseNode";
import type { BNBodyTooltipType } from "./BaseNode";
import type { ColorPattern } from "./type";
import type { NodeProps } from "@xyflow/react";
import { getColor } from "./utils";
import { Play } from "@phosphor-icons/react";
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
    const [isHovered, setIsHovered] = useState(false);
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

    return (
        <BaseNode colors={colors} selected={true}>
            <BNBody>
                <BNBodyContent>
                    <div className="flex flex-col w-full items-center">
                        <div className="p-[2px] w-full">
                            <div className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer text-center">
                                {nodeData.content || "Click to ask another question"}
                            </div>
                        </div>
                        <button
                            className={`mt-3 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 ${
                                isHovered ? "bg-emerald-200" : "hover:bg-emerald-200"
                            }`}
                            type="button"
                            onClick={e => {
                                e.stopPropagation();
                                setFreeNodeId(id);
                                nodeData.onSelect?.();
                                if (typeof window !== 'undefined') {
                                    (window as Window & { __fromFreeNode?: boolean }).__fromFreeNode = true;
                                }
                            }}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            aria-label="Start"
                        >
                            <Play size={18} weight="fill" className="text-emerald-700" />
                        </button>
                    </div>
                </BNBodyContent>
                <BNBodyTooltip enableDelete tools={tools} />
            </BNBody>
            <BNHandle colors={colors} enableSourceHandle enableTargetHandle />
        </BaseNode>
    );
}); 