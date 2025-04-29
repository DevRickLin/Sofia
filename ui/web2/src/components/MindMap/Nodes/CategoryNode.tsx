import { memo } from "react";
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
import type { BNBodyTooltipType } from "./BaseNode";
import { useEdges } from "@xyflow/react";
import { getColor } from "./utils";
import { NotificationBadge } from "./NotificationBadge";
import type { NotificationStatus } from "../types";

export interface CategoryNodeData {
    id: string;
    title: string;
    summary: string;
    position: { x: number; y: number };
    color: Color;
    isDetailExpanded?: boolean;
    isChildrenExpanded?: boolean;
    expandNode?: (nodeId: string) => void;
    badges?: BNBodyTooltipType[];
    notification?: {
        status: NotificationStatus;
        onNotificationClick?: () => Promise<void>;
    };
    parentId?: string;
    [key: string]: unknown;
}

export interface CategoryNodeProps extends NodeProps<CategoryNode> {
    onDelete?: (nodeId: string) => void;
    onNodeContextMenu?: (info: { x: number; y: number; nodeId: string }) => void;
    isDetailExpanded?: boolean;
    isChildrenExpanded?: boolean;
    toggleDetailExpanded?: (nodeId: string, isExpanded: boolean) => void;
}

type CategoryNode = Node<CategoryNodeData, "CategoryNode">;

export const CategoryNode = memo((props: CategoryNodeProps) => {
    const { data, selected, id, isDetailExpanded = false, isChildrenExpanded = false, toggleDetailExpanded } = props;
    const colors: ColorPattern = getColor(data.color);
    const edges = useEdges();
    const hasChildren = edges.some(edge => edge.source === id);

    const handleExpandNode = (nodeId: string) => {
        if (data.expandNode) {
            data.expandNode(nodeId);
        }
    };

    // 只在根节点（没有父节点的节点）显示通知图标
    const notificationTool = !data.parentId && data.notification ? {
        icon: (
            <NotificationBadge
                status={data.notification.status}
                onClick={data.notification.onNotificationClick || (async () => {})}
            />
        ),
        forceVisible: true,
        onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            if (data.notification?.onNotificationClick) {
                void data.notification.onNotificationClick();
            }
        }
    } : undefined;

    // Debug logs
    console.log('CategoryNode render:', {
        nodeId: id,
        parentId: data.parentId,
        hasNotification: !!data.notification,
        notificationStatus: data.notification?.status,
        willShowBadge: !data.parentId && !!data.notification
    });

    // Combine notification badge with custom badges
    const tools: BNBodyTooltipType[] = [
        ...(notificationTool ? [notificationTool] : []),
        ...(data.badges || []),
    ];

    return (
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
                    tools={tools}
                    onDelete={props.onDelete}
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
