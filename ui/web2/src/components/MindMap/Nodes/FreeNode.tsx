import { memo } from "react";
import {
    BaseNode,
    BNBody,
    BNBodyContent,
    BNBodyTooltip,
    BNHandle,
    BNBodyTooltipType,
} from "./BaseNode";
import { ColorPattern } from "./type";
import { NodeProps } from "@xyflow/react";
import { getColor } from "./utils";

export interface FreeNodeData extends Record<string, unknown> {
    content: string;
    onDelete?: (id: string) => void;
    onSelect?: () => void;
}

export const FreeNode = memo((props: NodeProps) => {
    const { data, selected, id } = props;
    const colors: ColorPattern = getColor("gray");
    const nodeData = data as FreeNodeData;

    const tools: BNBodyTooltipType[] = [
        {
            icon: <></>,
            label: "Delete",
            forceVisible: false,
            onClick: () => nodeData.onDelete?.(id),
        },
    ];

    return (
        <BaseNode colors={colors} selected={!!selected}>
            <BNBody>
                <BNBodyContent>
                    <div>
                        <div className="p-[2px]">
                            <div className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                                {nodeData.content || "Click to ask another question"}
                            </div>
                        </div>
                    </div>
                </BNBodyContent>
                <BNBodyTooltip enableDelete tools={tools} />
            </BNBody>
            <BNHandle colors={colors} enableSourceHandle enableTargetHandle />
        </BaseNode>
    );
}); 