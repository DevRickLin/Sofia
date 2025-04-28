import { createContext } from "react";

export const BaseNodeContext = createContext<{
    isTooltipVisible: boolean;
    showTooltip: () => void;
    hideTooltip: () => void;
    isDetailExpanded: boolean;
    setIsDetailExpanded: (isExpanded: boolean) => void;
    isChildrenExpanded: boolean;
    setIsChildrenExpanded: (isExpanded: boolean) => void;
}>(
    {
        isTooltipVisible: false,
        showTooltip: () => {},
        hideTooltip: () => {},
        isDetailExpanded: false,
        setIsDetailExpanded: () => {},
        isChildrenExpanded: false,
        setIsChildrenExpanded: () => {},
    }
);
