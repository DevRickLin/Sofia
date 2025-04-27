import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";
import { initialNodes, initialEdges } from "../data/mindmapData";

interface Canvas {
    id: string;
    name: string;
    nodes: Node[];
    edges: Edge[];
    createdAt: Date;
}

interface CanvasStore {
    canvases: Canvas[];
    currentCanvasId: string;
    addCanvas: () => void;
    setCurrentCanvas: (id: string) => void;
    updateCanvas: (id: string, nodes: Node[], edges: Edge[]) => void;
    updateCanvasName: (id: string, name: string) => void;
}

const defaultCanvas: Canvas = {
    id: "ai-breakthroughs",
    name: "AI Agent Breakthroughs",
    nodes: initialNodes,
    edges: initialEdges,
    createdAt: new Date(),
};

export const useCanvasStore = create<CanvasStore>((set, get) => ({
    canvases: [defaultCanvas],
    currentCanvasId: defaultCanvas.id,

    addCanvas: () => {
        const newCanvas: Canvas = {
            id: `canvas-${Date.now()}`,
            name: "Untitled",
            nodes: [],
            edges: [],
            createdAt: new Date(),
        };

        set((state) => ({
            canvases: [...state.canvases, newCanvas],
            currentCanvasId: newCanvas.id,
        }));
    },

    setCurrentCanvas: (id: string) => {
        set({ currentCanvasId: id });
    },

    updateCanvas: (id: string, nodes: Node[], edges: Edge[]) => {
        const currentCanvas = get().canvases.find((c) => c.id === id);
        if (!currentCanvas) return;

        // Only update if there are actual changes
        const hasChanges =
            JSON.stringify(currentCanvas.nodes) !== JSON.stringify(nodes) ||
            JSON.stringify(currentCanvas.edges) !== JSON.stringify(edges);

        if (hasChanges) {
            set((state) => ({
                canvases: state.canvases.map((canvas) =>
                    canvas.id === id ? { ...canvas, nodes, edges } : canvas
                ),
            }));
        }
    },

    updateCanvasName: (id: string, name: string) => {
        set((state) => ({
            canvases: state.canvases.map((canvas) =>
                canvas.id === id ? { ...canvas, name } : canvas
            ),
        }));
    },
}));
