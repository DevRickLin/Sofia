import { createContext } from "react";

export const BaseNodeContext = createContext<{
    isTooltipVisible: boolean;
    showTooltip: () => void;
    hideTooltip: () => void;
    isExpanded: boolean;
    setIsExpanded: (isExpanded: boolean) => void;
}>({
    isTooltipVisible: false,
    showTooltip: () => {},
    hideTooltip: () => {},
    isExpanded: false,
    setIsExpanded: () => {},
});
