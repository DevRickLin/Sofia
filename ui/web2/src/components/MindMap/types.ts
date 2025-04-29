import type { Node } from "@xyflow/react";

export interface KeyInsight {
  id: string;
  content: string;
  implications: string;
  relatedTechnologies?: string[];
  visible?: boolean;
}

export interface NodeData extends Record<string, unknown> {
  title?: string;
  label?: string;
  description?: string;
  relatedBreakthroughs?: string[];
  isExpanded?: boolean;
  date?: string;
  organization?: string;
  source?: string;
  summary?: string;
  details?: string;
  keyInsights?: KeyInsight[];
}

export type NodeWithData = Node<NodeData>;

export type NotificationStatus = 'none' | 'loading' | 'completed';

export interface NodeNotification {
    status: NotificationStatus;
    lastUpdated?: string;
} 