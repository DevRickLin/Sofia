import React, {
    forwardRef,
    useRef,
    useState,
    useEffect,
    useContext,
} from "react";
import { BaseNodeContext } from "./context";

export const BNExpandContent = forwardRef<
    HTMLDivElement,
    { children: React.ReactNode }
>(({ children, ...props }, _ref) => {
    const { isExpanded } = useContext(BaseNodeContext);
    const ref = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState("0px");

    useEffect(() => {
        if (ref.current) {
            if (isExpanded) {
                const scrollHeight = ref.current.scrollHeight;
                setHeight(`${scrollHeight}px`);
            } else {
                setHeight("0px");
            }
        }
    }, [isExpanded]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        if (isExpanded) {
            const scrollHeight = el.scrollHeight;
            setHeight(`${scrollHeight}px`);

            // After transition, set to auto
            const timeout = setTimeout(() => {
                setHeight("auto");
            }, 500); // Match the duration

            return () => clearTimeout(timeout);
        } else {
            setHeight(`${el.scrollHeight}px`); // start from current height
            // force reflow to allow animation back to 0
            requestAnimationFrame(() => {
                setHeight("0px");
            });
        }
    }, [isExpanded]);

    return (
        <div
            ref={ref}
            {...props}
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
                isExpanded ? "opacity-100" : "max-h-0 opacity-0"
            }`}
            style={{
                maxHeight: isExpanded ? height : "0px",
                opacity: isExpanded ? 1 : 0,
            }}
        >
            {children}
        </div>
    );
});

BNExpandContent.displayName = "BNExpandContent";
