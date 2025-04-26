import { forwardRef, HTMLAttributes, useContext } from "react";
import { Handle, Position } from "@xyflow/react";
import { ColorPattern } from "../type";
import { BaseNodeContext } from "./context";

export type BNHandleProps = HTMLAttributes<HTMLDivElement> & {
    enableSourceHandle?: boolean;
    enableTargetHandle?: boolean;
    colors: ColorPattern;
};

export const BNHandle = forwardRef<HTMLDivElement, BNHandleProps>(
    (
        {
            colors,
            enableSourceHandle = false,
            enableTargetHandle = false,
            ...props
        },
        ref
    ) => {
        const { isTooltipVisible } = useContext(BaseNodeContext);

        return (
            <div ref={ref} {...props}>
                <Handle
                    type="target"
                    position={Position.Top}
                    isConnectable={enableSourceHandle}
                    className={`${colors.handle} !border-0 !bg-transparent !cursor-grab`}
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    isConnectable={enableTargetHandle}
                    className={`!bottom-[-24px] !rounded-2xl !bg-transparent transition-all duration-200 ease-in ${
                        enableTargetHandle && isTooltipVisible
                            ? "!p-[8px]"
                            : "!p-[4px]"
                    } ${
                        enableTargetHandle
                            ? "!border-gray-500/50 hover:!border-gray-500 hover:!border-[1.5px]"
                            : "!border-transparent"
                    }
                   `}
                />
            </div>
        );
    }
);

BNHandle.displayName = "BNHandle";
