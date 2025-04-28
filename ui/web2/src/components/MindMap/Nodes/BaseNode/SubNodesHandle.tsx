import React from "react";
import { BNExpandButton } from "./BNExpandButton";

interface SubNodesHandleProps {
    expandNode: (nodeId: string) => void;
    nodeId: string;
    isExpanded: boolean;
}

export const SubNodesHandle: React.FC<SubNodesHandleProps> = ({ expandNode, nodeId, isExpanded }) => {
    return (
        <BNExpandButton
            isExpanded={isExpanded}
            onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                expandNode(nodeId);
            }}
            position="bottom"
            className="bottom-[-16px] z-10"
            useCaretIcons={true}
        />
    );
};
