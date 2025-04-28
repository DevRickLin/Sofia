import { CaretDown, CaretUp } from "@phosphor-icons/react";

interface SubNodesHandleProps {
    expandNode: (nodeId: string) => void;
    nodeId: string;
    isExpanded: boolean;
}

export const SubNodesHandle: React.FC<SubNodesHandleProps> = ({ expandNode, nodeId, isExpanded }) => {
    return (
        <div
            className="absolute left-1/2 -translate-x-1/2 mt-2 flex items-center justify-center"
            style={{
                top: "calc(100% + 4px)",
            }}
            onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                expandNode(nodeId);
            }}
        >
            <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center cursor-pointer transition-colors duration-200 shadow-sm">
                {isExpanded ? (
                    <CaretUp
                        weight="bold"
                        size={12}
                        className="text-gray-500 dark:text-gray-400"
                    />
                ) : (
                    <CaretDown
                        weight="bold"
                        size={12}
                        className="text-gray-500 dark:text-gray-400"
                    />
                )}
            </div>
        </div>
    );
};
