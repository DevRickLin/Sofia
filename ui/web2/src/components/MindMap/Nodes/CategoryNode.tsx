import { memo, useState, useEffect } from "react";
import {
    BaseNode,
    BNBody,
    BNBodyContent,
    BNBodyTooltip,
    BNHandle,
    SubNodesHandle,
    BNExpandContent,
} from "./BaseNode";
import type { ColorPattern, Color } from "./type";
import type { NodeProps, Node } from "@xyflow/react";
import { useEdges } from "@xyflow/react";
import { getColor } from "./utils";

export interface CategoryNodeData {
    id: string;
    title: string;
    summary: string;
    position: { x: number; y: number };
    color: Color;
    isDetailExpanded?: boolean;
    isChildrenExpanded?: boolean;
    expandNode?: (nodeId: string) => void;
    [key: string]: unknown;
}

type CategoryNode = Node<CategoryNodeData, "CategoryNode">;

export const CategoryNode = memo((props: NodeProps<CategoryNode>) => {
    const { data, selected, id } = props;
    const colors: ColorPattern = getColor(data.color);
    const [isDetailExpanded, setIsDetailExpanded] = useState(data.isDetailExpanded || false);
    const [isChildrenExpanded, setIsChildrenExpanded] = useState(data.isChildrenExpanded || false);

    // Check if the node has any children
    const edges = useEdges();
    const hasChildren = edges.some(edge => edge.source === id);

    // Sync with external expanded state changes
    useEffect(() => {
        setIsDetailExpanded(data.isDetailExpanded || false);
    }, [data.isDetailExpanded]);
    useEffect(() => {
        setIsChildrenExpanded(data.isChildrenExpanded || false);
    }, [data.isChildrenExpanded]);

    const handleExpandNode = (nodeId: string) => {
        if (data.expandNode) {
            data.expandNode(nodeId);
        }
    };

    return (
        <BaseNode
            colors={colors}
            selected={selected}
            initialDetailExpanded={isDetailExpanded}
            initialChildrenExpanded={isChildrenExpanded}
        >
            <BNBody>
                <BNBodyContent>
                    <div>
                        <h3
                            className="text-lg font-semibold"
                            style={{
                                color: colors.title_color,
                            }}
                        >
                            {data.title}
                        </h3>
                        <div className="p-[2px]">
                            <div
                                className="mt-1 pl-3 border-l-2 border-[#bdbdbd]/30 text-sm text-[#757575]"
                            >
                                {data.summary}
                            </div>
                        </div>
                    </div>
                </BNBodyContent>
                <BNBodyTooltip 
                    enableExpand 
                    enableDelete 
                    nodeId={id}
                />
            </BNBody>
            <BNHandle colors={colors} enableSourceHandle enableTargetHandle />
            <BNExpandContent>
                <div className="border-t border-dashed border-gray-400 mt-4 mb-2 mx-4" />
                <div className="text-[#757575] p-2">{data.summary}</div>
            </BNExpandContent>
            {hasChildren && data.expandNode && (
                <SubNodesHandle 
                    expandNode={handleExpandNode} 
                    nodeId={id} 
                    isExpanded={isChildrenExpanded}
                />
            )}
        </BaseNode>
    );
});
