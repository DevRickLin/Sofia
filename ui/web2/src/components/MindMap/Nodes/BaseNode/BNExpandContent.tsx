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
    const { isDetailExpanded } = useContext(BaseNodeContext);
    const ref = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState("0px");
    const [contentChanged, setContentChanged] = useState(false);

    // Check if content has changed - useful to trigger resize when insights are added
    useEffect(() => {
        setContentChanged(prev => !prev);
    }, [children]);

    // Adjust height when expansion state changes or content changes
    useEffect(() => {
        if (ref.current) {
            if (isDetailExpanded) {
                const scrollHeight = ref.current.scrollHeight;
                // Add extra padding to ensure all content is visible
                setHeight(`${scrollHeight + 20}px`);
            } else {
                setHeight("0px");
            }
        }
    }, [isDetailExpanded, contentChanged]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        if (isDetailExpanded) {
            const scrollHeight = el.scrollHeight;
            // Add extra padding to ensure all content is visible
            setHeight(`${scrollHeight + 20}px`);

            // After transition, set to auto to accommodate any content changes
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
    }, [isDetailExpanded, contentChanged]);

    // Create a mutation observer to detect content changes
    useEffect(() => {
        if (!ref.current) return;
        
        const observer = new MutationObserver(() => {
            if (isDetailExpanded && ref.current) {
                const scrollHeight = ref.current.scrollHeight;
                setHeight(`${scrollHeight + 20}px`);
                
                // Reset to auto after transition
                setTimeout(() => {
                    setHeight("auto");
                }, 300);
            }
        });
        
        observer.observe(ref.current, { 
            childList: true, 
            subtree: true, 
            characterData: true,
            attributes: true
        });
        
        return () => observer.disconnect();
    }, [isDetailExpanded]);

    return (
        <div
            ref={ref}
            {...props}
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
                isDetailExpanded ? "opacity-100" : "max-h-0 opacity-0"
            }`}
            style={{
                maxHeight: isDetailExpanded ? height : "0px",
                opacity: isDetailExpanded ? 1 : 0,
            }}
        >
            {children}
        </div>
    );
});

BNExpandContent.displayName = "BNExpandContent";
