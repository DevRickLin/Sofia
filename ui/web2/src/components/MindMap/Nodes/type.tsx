// ======================================= //
//                Colors                   //
// ======================================= //

export type ColorPattern = {
    default: string; // rgb hex
    light: string; // rgb hex
    dark: string; // rgb hex
    bg: string;
    border: string;
    title: string;
    text: string;
    handle: string;
    hover: string;
};

export type Color = "red" | "blue" | "green" | "yellow" | "gray" | "purple";

// ======================================= //
//                Nodes                    //
// ======================================= //
export type NodeCategory = "RootNode" | "CategoryNode" | "Notes";

export type BaseNodeData = {
    id: string;
    category: NodeCategory;
    position: { x: number; y: number }; // Added position property
    color: Color;
    data: Record<string, unknown>;
};
