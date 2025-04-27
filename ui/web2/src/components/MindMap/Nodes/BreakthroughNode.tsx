import { memo } from "react";
import {
    BaseNode,
    BNBody,
    BNBodyContent,
    BNBodyTooltip,
    BNHandle,
    BNExpandContent,
} from "./BaseNode";
import { ColorPattern, Color } from "./type";
import { NodeProps, Node, useNodes } from "@xyflow/react";
import { getColor } from "./utils";
import { CategoryNodeData } from "./CategoryNode";

type KeyInsightType = {
    content: string;
    implications: string;
    relatedTechnologies: string[];
};

export interface BreakthroughNodeData {
    id: string;
    title: string;
    summary: string;
    details: string;
    date: string;
    organization: string;
    source: string;
    keyInsights: KeyInsightType[];
    position: { x: number; y: number };
    color: Color;
    parentId?: string;
    [key: string]: unknown;
}

type BreakthroughNode = Node<BreakthroughNodeData, "BreakthroughNode">;

export const BreakthroughNode = memo((props: NodeProps<BreakthroughNode>) => {
    const { data, selected } = props;
    let colors: ColorPattern = getColor(data.color);
    // colors.light_background = colors.light_background_content_node;
    colors = {
        ...colors,
        light_background: colors.light_background_content_node,
    };

    return (
        <BaseNode colors={colors} selected={selected}>
            <BNBody>
                <BNBodyContent>
                    <div>
                        <h3
                            className={`text-lg font-semibold`}
                            style={{
                                color: colors.title_color,
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
                <BNBodyTooltip enableChat enableExpand enableDelete />
            </BNBody>
            <BNHandle colors={colors} enableSourceHandle enableTargetHandle />
            <BNExpandContent>
                <div className="border-t border-dashed border-gray-400 mt-4 mb-2 mx-4"></div>
                <div className="text-[#757575] p-2">{data.details}</div>
            </BNExpandContent>
        </BaseNode>
    );
});
