import { useState } from "react";
import { CaretCircleDown, CaretCircleUp } from "@phosphor-icons/react";

export const SubNodesHandle = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            className="absolute left-1/2 -translate-x-1/2 mt-2 flex items-center justify-center"
            style={{
                top: "calc(100% + 6px)",
            }}
            onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                setIsExpanded((prev) => !prev);
            }}
        >
            {isExpanded ? (
                <CaretCircleUp
                    size={20}
                    className="text-gray-500/50 hover:scale-125 hover:text-gray-500 transition-transform duration-200 ease-in-out"
                />
            ) : (
                <CaretCircleDown
                    size={20}
                    className="text-gray-500/50 hover:scale-125 hover:text-gray-500 transition-transform duration-200 ease-in-out"
                />
            )}
        </div>
    );
};
