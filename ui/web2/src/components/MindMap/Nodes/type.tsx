// ======================================= //
//                Colors                   //
// ======================================= //

export type ColorPattern = {
    title_color: string; // rgb hex
    light_background: string; // rgb hex
    light_background_content_node: string; // rgb hex
    dark_background: string; // rgb hex
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
