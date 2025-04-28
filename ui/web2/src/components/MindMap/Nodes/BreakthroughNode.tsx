import { memo } from "react";
import {
    BaseNode,
    BNBody,
    BNBodyContent,
    BNBodyTooltip,
    BNHandle,
    BNExpandContent,
    SubNodesHandle,
} from "./BaseNode";
import { ColorPattern, Color } from "./type";
import { NodeProps, Node, useNodes, useEdges } from "@xyflow/react";
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
    expandNode?: (nodeId: string) => void;
    [key: string]: unknown;
}

type BreakthroughNode = Node<BreakthroughNodeData, "BreakthroughNode">;

export const BreakthroughNode = memo((props: NodeProps<BreakthroughNode>) => {
    const { data, selected, id } = props;
    let colors: ColorPattern = getColor(data.color);
    colors = {
        ...colors,
        light_background: colors.light_background_content_node,
    };

    // Check if the node has any children using useNodes hook
    const nodes = useNodes();
    const edges = useEdges();
    const hasChildren = edges.some(edge => edge.source === id);

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
                <BNBodyTooltip 
                    enableChat 
                    enableExpand 
                    enableDelete 
                    nodeId={id}
                />
            </BNBody>
            <BNHandle colors={colors} enableSourceHandle enableTargetHandle />
            <BNExpandContent>
                <div className="border-t border-dashed border-gray-400 mt-4 mb-2 mx-4"></div>
                <div className="text-[#757575] p-2">{data.details}</div>
            </BNExpandContent>
            {hasChildren && data.expandNode && (
                <SubNodesHandle expandNode={data.expandNode} nodeId={id} />
            )}
        </BaseNode>
    );
});
