import { memo, useState } from "react";
import {
    BaseNode,
    BNBody,
    BNBodyContent,
    BNBodyTooltip,
    BNHandle,
    BNBodyTooltipType,
    SubNodesHandle,
} from "./BaseNode";
import { ColorPattern, Color } from "./type";
import { NodeProps, Node } from "@xyflow/react";
import { Lightbulb } from "@phosphor-icons/react";
import { getColor } from "./utils";

export interface CategoryNodeData {
    id: string;
    title: string;
    summary: string;
    position: { x: number; y: number };
    color: Color;
    [key: string]: unknown;
}

type CategoryNode = Node<CategoryNodeData, "CategoryNode">;

export const CategoryNode = memo((props: NodeProps<CategoryNode>) => {
    const { data, selected } = props;

    const colors: ColorPattern = getColor(data.color);
    const [isExpanded, setIsExpanded] = useState(false);

    const tools: BNBodyTooltipType[] = [
        {
            icon: <Lightbulb className="text-gray-400 hover:text-yellow-300" />,
            label: "Insight",
            forceVisible: false,
            onClick: (event) => {
                event.stopPropagation();
                event.preventDefault();
                setIsExpanded(!isExpanded);
            },
        },
    ];

    return (
        <BaseNode colors={colors} selected={selected}>
            <BNBody>
                <BNBodyContent>
                    <div>
                        <h3
                            className={`text-lg font-semibold`}
                            style={{
                                color: colors.default,
                            }}
                        >
                            {data.title}
                        </h3>
                        <div className="p-[2px]">
                            <div
                                className={`mt-1 pl-3 border-l-2 border-[#bdbdbd]/30 text-sm text-[#757575]`}
                            >
                                {data.summary}
                            </div>
                        </div>
                    </div>
                </BNBodyContent>
                <BNBodyTooltip tools={tools} enableChat enableDelete />
            </BNBody>
            <BNHandle colors={colors} />
            <SubNodesHandle />
        </BaseNode>
    );
});
