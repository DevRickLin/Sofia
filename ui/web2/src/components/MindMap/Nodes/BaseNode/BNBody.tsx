import React, { forwardRef } from "react";

type BaseNodeBodyProps = {
    children: React.ReactNode;
    isExpanded?: boolean;
    isSelected?: boolean;
};

export const BNBody = forwardRef<HTMLDivElement, BaseNodeBodyProps>(
    ({ children, ...props }, ref) => {
        return (
            <div ref={ref} {...props} className={`flex h-full justify-between`}>
                {children}
            </div>
        );
    }
);

BNBody.displayName = "BNBody";

export const BNBodyContent = forwardRef<
    HTMLDivElement,
    { children: React.ReactNode }
>(({ children, ...props }, ref) => {
    return (
        <div
            ref={ref}
            {...props}
            className={`flex h-full justify-between w-[208px] pr-1`}
        >
            {children}
        </div>
    );
});

BNBodyContent.displayName = "BNBodyContent";

// Import BNBodyTooltip from its dedicated file
export { BNBodyTooltip } from './BNBodyTooltip';
