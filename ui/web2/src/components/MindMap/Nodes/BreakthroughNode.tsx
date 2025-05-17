import { memo, useRef, useState } from "react";
import {
    BaseNode,
    BNBody,
    BNBodyContent,
    BNBodyTooltip,
    BNHandle,
    BNExpandContent,
    SubNodesHandle,
} from "./BaseNode";
import type { ColorPattern, Color } from "./type";
import type { NodeProps, Node } from "@xyflow/react";
import { useEdges } from "@xyflow/react";
import { getColor } from "./utils";
import { Lightbulb } from "@phosphor-icons/react";
import type { KeyInsight } from "../types";
import { NodeEditModal } from "../Editor";

export interface BreakthroughNodeData {
    id: string;
    title: string;
    summary: string;
    details: string;
    date: string;
    organization: string;
    source: string;
    keyInsights: KeyInsight[];
    position: { x: number; y: number };
    color: Color;
    parentId?: string;
    expandNode?: (nodeId: string) => void;
    isDetailExpanded?: boolean;
    isChildrenExpanded?: boolean;
    onNodeEdit?: (nodeId: string, updatedData: Partial<BreakthroughNodeData>) => void;
    [key: string]: unknown;
}

export interface BreakthroughNodeProps extends NodeProps<BreakthroughNode> {
    onDelete?: (nodeId: string) => void;
    onNodeContextMenu?: (info: { x: number; y: number; nodeId: string }) => void;
    isDetailExpanded?: boolean;
    isChildrenExpanded?: boolean;
    toggleDetailExpanded?: (nodeId: string, isExpanded: boolean) => void;
}

type BreakthroughNode = Node<BreakthroughNodeData>;

export const BreakthroughNode = memo(function BreakthroughNode(props: BreakthroughNodeProps) {
    const { data, selected, id, isDetailExpanded = false, isChildrenExpanded = false, toggleDetailExpanded } = props;
    let colors: ColorPattern = getColor(data.color);
    const insightsContainerRef = useRef<HTMLDivElement>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    colors = {
        ...colors,
        light_background: colors.light_background_content_node,
    };

    // Check if the node has any children
    const edges = useEdges();
    const hasChildren = edges.some(edge => edge.source === id);

    const handleExpandNode = (nodeId: string) => {
        if (data.expandNode) {
            data.expandNode(nodeId);
        }
    };

    const handleNodeEdit = (updatedData: Partial<BreakthroughNodeData>) => {
        if (data.onNodeEdit) {
            data.onNodeEdit(id, updatedData);
        }
    };

    return (
        <>
            <BaseNode
                colors={colors}
                selected={selected}
                nodeId={id}
                expandNode={handleExpandNode}
                toggleDetailExpanded={toggleDetailExpanded}
                onDelete={props.onDelete}
                isDetailExpanded={isDetailExpanded}
                isChildrenExpanded={isChildrenExpanded}
                onNodeContextMenu={props.onNodeContextMenu}
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
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                                <span>{data.date}</span>
                                <span className="mx-1">•</span>
                                <span>{data.organization}</span>
                            </div>
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
                        enableEdit
                        nodeId={id}
                        onDelete={props.onDelete}
                        onEdit={() => setIsEditModalOpen(true)}
                    />
                </BNBody>
                <BNHandle colors={colors} enableSourceHandle enableTargetHandle />
                <BNExpandContent>
                    <div className="border-t border-dashed border-gray-400 mt-4 mb-2 mx-4" />
                    <div className="text-[#757575] p-2">
                        {data.details}
                    </div>
                    {data.keyInsights && data.keyInsights.filter(insight => insight.visible).length > 0 && (
                        <div className="mt-4 mx-2 mb-4" ref={insightsContainerRef}>
                            <div className="flex items-center pl-3 mb-2.5">
                                <div 
                                    className="h-5 w-5 rounded-full flex items-center justify-center mr-1.5"
                                    style={{ 
                                        backgroundColor: `${colors.title_color}15`,
                                    }}
                                >
                                    <Lightbulb 
                                        className="h-3.5 w-3.5" 
                                        style={{ color: colors.title_color }}
                                        weight="fill"
                                    />
                                </div>
                                <h4 
                                    className="text-sm font-semibold tracking-wide" 
                                    style={{ color: colors.title_color }}
                                >
                                    Key Insights
                                </h4>
                            </div>
                            <div className="space-y-2.5">
                                {data.keyInsights
                                    .filter(insight => !!insight.id && insight.visible)
                                    .map((insight) => (
                                        <div 
                                            key={insight.id} 
                                            style={{
                                                backgroundColor: `${colors.light_background}dd`,
                                                borderLeft: `2px solid ${colors.title_color}40`,
                                            }}
                                            className="rounded-r-lg py-2.5 px-3 hover:shadow-sm transition-shadow duration-200"
                                        >
                                            <div className="flex items-start">
                                                <p 
                                                    className="text-sm leading-5 break-words" 
                                                    style={{ color: colors.title_color }}
                                                >
                                                    {insight.content}
                                                </p>
                                            </div>
                                            
                                            {insight.implications && (
                                                <p 
                                                    className="text-xs leading-relaxed mt-1.5 italic break-words"
                                                    style={{ color: `${colors.title_color}cc` }}
                                                >
                                                    {insight.implications}
                                                </p>
                                            )}
                                            
                                            {insight.relatedTechnologies && insight.relatedTechnologies.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {insight.relatedTechnologies.map((tech) => (
                                                        <span 
                                                            key={tech}
                                                            style={{
                                                                backgroundColor: `${colors.title_color}10`,
                                                                color: colors.title_color,
                                                                borderColor: `${colors.title_color}20`,
                                                            }}
                                                            className="inline-flex items-center text-[11px] leading-none px-2 py-1 rounded-full border font-medium hover:shadow-sm transition-shadow duration-200"
                                                        >
                                                            {tech}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </BNExpandContent>
                {hasChildren && data.expandNode && (
                    <SubNodesHandle 
                        expandNode={handleExpandNode} 
                        nodeId={id} 
                        isExpanded={isChildrenExpanded}
                    />
                )}
            </BaseNode>

            {/* 编辑弹窗 */}
            {isEditModalOpen && (
                <NodeEditModal
                    nodeData={data}
                    onSave={handleNodeEdit}
                    onClose={() => setIsEditModalOpen(false)}
                    isOpen={isEditModalOpen}
                />
            )}
        </>
    );
});
