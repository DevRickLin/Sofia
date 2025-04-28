import type { Node, Edge } from "@xyflow/react";

const addOnExpandToNodeData = (nodes: Node[]): Node[] => {
    return nodes.map((node) => ({
        ...node,
        data: {
            ...node.data,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            onExpand: (_id: string) => {
                // This will be replaced at runtime with actual function
            },
        },
    }));
};

// 1. 定义网格尺寸
const GRID_WIDTH = 200;
const GRID_HEIGHT = 120;

// 类型安全：定义带 gridPosition 的类型
interface NodeWithGrid extends Omit<Node, "position"> {
    gridPosition: { col: number; row: number };
    parentId?: string;
}

// 用于初始 mock 的类型（无 gridPosition）
type BaseNode = Omit<NodeWithGrid, "gridPosition">;

// 2. gridPosition => position 工具函数
function gridToPosition(nodes: NodeWithGrid[], rowGap = 2): Node[] {
    return nodes.map((node) => {
        const { gridPosition, ...rest } = node;
        return {
            ...rest,
            position: {
                x: gridPosition.col * GRID_WIDTH,
                y: gridPosition.row * GRID_HEIGHT * rowGap,
            },
        };
    });
}

// 自动分配 gridPosition 的递归算法（树形布局，叶子间隔，父节点居中）
function assignGridPositions(nodes: BaseNode[], minGap = 2): NodeWithGrid[] {
    // 1. 构建 id->children 映射
    const childrenMap: Record<string, BaseNode[]> = {};
    for (const node of nodes) {
        if (node.parentId) {
            if (!childrenMap[node.parentId]) childrenMap[node.parentId] = [];
            childrenMap[node.parentId].push(node);
        }
    }
    // 2. 递归布局
    const result: NodeWithGrid[] = [];
    let colCounter = 0;
    function layout(node: BaseNode, row: number): { col: number; width: number } {
        const children = childrenMap[node.id] || [];
        if (children.length === 0) {
            // 叶子节点
            const col = colCounter;
            colCounter += minGap;
            result.push({ ...node, gridPosition: { col, row } });
            return { col, width: 1 };
        }
        // 递归布局子节点
        const childLayouts = children.map(child => layout(child, row + 1));
        const minCol = childLayouts[0].col;
        const maxCol = childLayouts[childLayouts.length - 1].col;
        const col = Math.floor((minCol + maxCol) / 2);
        const width = childLayouts.reduce((sum, c) => sum + c.width, 0) + (children.length - 1) * (minGap - 1);
        result.push({ ...node, gridPosition: { col, row } });
        return { col, width };
    }
    // 找到根节点
    const root = nodes.find(n => !n.parentId);
    if (root) layout(root, 0);
    return result;
}

// 3. 用 parentId 组织 baseNodes，所有节点平铺
const baseNodes: BaseNode[] = [
    // 根节点
    {
        id: "root",
        type: "category",
        parentId: undefined,
        data: {
            title: "AI Agent Breakthroughs",
            summary: "Recent advances in AI agents from Oct 2024 to Apr 2025",
            color: "gray",
            isExpanded: true,
            relatedBreakthroughs: [
                "Autonomous Agent Frameworks",
                "Multi-Agent Collaboration",
                "Embodied AI",
                "Domain-Specific Assistants",
                "Reasoning & Memory Advances",
            ],
        },
    },
    // 一级分类
    { id: "cat1", type: "category", parentId: "root", data: { title: "Autonomous Agents", summary: "Frameworks enabling AI to operate independently and handle complex tasks", color: "yellow", isExpanded: false } },
    { id: "cat2", type: "category", parentId: "root", data: { title: "Multi-Agent Systems", summary: "Multiple AI agents that specialize and collaborate to solve problems", color: "purple", isExpanded: false } },
    { id: "cat3", type: "category", parentId: "root", data: { title: "Embodied AI", summary: "Agents that perceive or act in simulated or real physical environments", color: "red", isExpanded: false } },
    { id: "cat4", type: "category", parentId: "root", data: { title: "Domain Assistants", color: "blue", summary: "Specialized AI for medicine, law, science, and other domains", isExpanded: false } },
    { id: "cat5", type: "category", parentId: "root", data: { title: "Reasoning & Memory", summary: "Improved cognitive abilities for AI agents, better reasoning and recall", color: "green", isExpanded: false } },
    // cat1 子节点
    { id: "break1_1", type: "breakthrough", parentId: "cat1", data: { title: "Claude 3.5 Computer Use", date: "Oct 2024", color: "yellow", organization: "Anthropic", summary: "AI model can control a GUI (click, type) autonomously to perform tasks", source: "https://anthropic.com", isExpanded: false, details: "A major update allowed the Claude 3.5 model to operate a computer GUI like a human user. In public beta, developers can direct Claude to observe a virtual screen, move the cursor, click buttons, and type input.", keyInsights: [ { content: "Claude 3.5 can observe a virtual screen, move the cursor, click buttons, and type input to operate a computer like a human user.", implications: "This enables agents to perform workflows like scheduling meetings or configuring software by simulating user actions on interfaces", relatedTechnologies: [ "GUI Automation", "Computer Vision", "Human-Computer Interaction" ] }, { content: "Early adopters like Replit used it to let an AI agent carry out multi-step tasks (dozens of UI actions) automatically.", implications: "This bridges AI with everyday software tools, allowing automation of tasks that previously required human intervention", relatedTechnologies: [ "Software Automation", "AI Assistants", "Workflow Optimization" ] } ] }, hidden: false },
    { id: "break1_2", type: "breakthrough", parentId: "cat1", data: { title: "Agent K v1.0", date: "Nov 2024", color: "yellow", organization: "Huawei & UCL", summary: "Autonomous data science agent reaching Kaggle Grandmaster-level performance", source: "https://medium.com", isExpanded: false, details: "Agent K can handle an entire data science project autonomously. Given a Kaggle competition URL, it downloads data, analyzes it, engineers features, trains models, and iteratively improves via an internal memory system.", keyInsights: [ { content: "Agent K achieved a 92.5% task success rate, earning results comparable to a top 5% Kaggle competitor (multiple gold medals).", implications: "AI can now perform at expert human level in complex data science competitions without human guidance", relatedTechnologies: [ "AutoML", "Automated Data Science", "Competitive ML" ] }, { content: "Agent K uses a flexible reasoning loop with short-term and long-term memory, updating its strategy based on past outcomes.", implications: "This memory-driven approach allows continuous improvement without model retraining", relatedTechnologies: [ "Memory Systems for AI", "Continual Learning", "Adaptive Strategy" ] } ] }, hidden: false },
    { id: "break1_3", type: "breakthrough", parentId: "cat1", data: { title: "The AI Scientist", date: "Sep 2024", color: "yellow", organization: "Univ. of Toronto/Oxford", summary: "Fully automated research pipeline for conducting AI research end-to-end", source: "https://arxiv.org", isExpanded: false, details: "An agent that can generate ideas, write code for experiments, run them, analyze results, and even write a draft research paper with figures and references – then critiques itself with a simulated peer-review loop." }, hidden: false },
    // cat2 子节点
    { id: "break2_1", type: "breakthrough", parentId: "cat2", data: { title: "MALT Training", date: "Dec 2024", color: "purple", organization: "Oxford & INRIA", summary: "Multi-agent LLM training framework that boosts reasoning accuracy on complex tasks", source: "https://arxiv.org", isExpanded: false, details: "MALT sets up three specialist agents (a Generator to propose solutions, a Verifier to check them, and a Refiner to improve them) that interact in a loop to solve problems more effectively than a single model." }, hidden: false },
    { id: "break2_2", type: "breakthrough", parentId: "cat2", data: { title: "AgentStore", date: "Oct 2024", color: "purple", organization: "Jia et al.", summary: 'Platform allowing specialized agents to be "plugged in" and orchestrated by a controller', source: "https://arxiv.org", isExpanded: false, details: "Each third-party agent is represented as a learnable token embedding in the MetaAgent's model, which lets the MetaAgent decide which expert to deploy at each step of a task." }, hidden: false },
    { id: "break2_3", type: "breakthrough", parentId: "cat2", data: { title: "Bel Esprit", date: "Dec 2024", color: "purple", organization: "aiXplain", summary: "Conversational agent that builds AI model pipelines via collaborating sub-agents", source: "https://arxiv.org", isExpanded: false, details: 'Bel Esprit leverages a team-of-agents architecture: for instance, a "Mentalist" agent clarifies the user\'s intent, a "Builder" agent assembles candidate pipeline steps, and other specialized agents handle different aspects of the solution.' }, hidden: false },
    // cat3 子节点
    { id: "break3_1", type: "breakthrough", parentId: "cat3", data: { title: "WALL-E Agent", date: "Oct 2024", color: "red", organization: "Tencent & UTS", summary: "LLM-based embodied agent with learned rules + MPC planning for improved results", source: "https://arxiv.org", isExpanded: false, details: "Through a gradient-free rule induction process, the agent observes where the LLM's predictions differ from reality and generates new rules to correct those errors. These learned rules, combined with the LLM, form an improved world model." }, hidden: false },
    { id: "break3_2", type: "breakthrough", parentId: "cat3", data: { title: "GenEx", date: "Nov 2024", color: "red", organization: "Johns Hopkins", summary: "Generative World Explorer that lets an embodied agent mentally explore unseen areas", source: "https://arxiv.org", isExpanded: false, details: 'GenEx uses a generative video model as a kind of "imagination engine." For example, an agent standing at a street corner can generate a plausible view around the next block without physically going there.' }, hidden: false },
    { id: "break3_3", type: "breakthrough", parentId: "cat3", data: { title: "Generative Agents", date: "Nov 2024", color: "red", organization: "Stanford / DeepMind", summary: "Simulated 1,000 distinct human personas in interactive environments with high realism", source: "https://arxiv.org", isExpanded: false, details: "Building on earlier work with 25 AI characters, this scaled-up version populated virtual environments with 1,000 agents that exhibit life-like routines and responses, using an LLM backbone and an episodic memory store." }, hidden: false },
    // cat4 子节点
    { id: "break4_1", type: "breakthrough", parentId: "cat4", data: { title: "MDAgents", date: "Dec 2024", color: "blue", organization: "MIT Media Lab", summary: 'Medical multi-agent system assigning AI "teams" to cases for improved diagnoses', source: "https://neurips.cc", isExpanded: false, details: 'A system where multiple LLM-based agents collaborate on medical cases, emulating how doctors confer in complex diagnoses. MDAgents assigns either a "solo" doctor-agent or a panel of specialist agents to a case depending on complexity.' }, hidden: false },
    { id: "break4_2", type: "breakthrough", parentId: "cat4", data: { title: "DynaSaur", date: "Nov 2024", color: "blue", organization: "Adobe Research", summary: "LLM agent that writes new code actions on the fly for doubled performance", source: "https://arxiv.org", isExpanded: false, details: "DynaSaur can generate and execute new code functions on demand, effectively expanding its toolset as needed to solve problems. This dynamic approach doubled performance on the GAIA generality benchmark." }, hidden: false },
    { id: "break4_3", type: "breakthrough", parentId: "cat4", data: { title: "GitHub Copilot X", date: "Nov 2024", color: "blue", organization: "GitHub", summary: "Expanded coding assistant using multiple models with improved orchestration abilities", source: "https://aitidbits.ai", isExpanded: false, details: "Copilot X expanded to use multiple underlying models and introduced a natural-language assistant that can orchestrate coding tasks, review repositories, and generate applications with minimal guidance." }, hidden: false },
    // cat5 子节点
    { id: "break5_1", type: "breakthrough", parentId: "cat5", data: { title: "PRefLexOR Reasoning", date: "Apr 2025", color: "green", organization: "MIT (Markus Buehler)", summary: "Recursive self-refinement method for building knowledge graphs and iterative thinking", source: "https://arxiv.org", isExpanded: false, details: 'PRefLexOR builds a dynamic knowledge graph as it reads text: it will pose questions about the text and retrieve relevant facts, organizing them into a structured graph it can use for reasoning. It also uses a "thinking token" strategy where the model has dedicated tokens to reflect.', keyInsights: [ { content: "During training, the model generates intermediate reasoning steps for a problem, then learns to prefer trajectories that lead to correct answers.", implications: "This approach marries reinforcement learning from self-consistency with symbolic knowledge graphs", relatedTechnologies: [ "Reinforcement Learning", "Knowledge Graphs", "Self-supervision" ] }, { content: "Even a 3B parameter model trained with PRefLexOR can outperform much larger models on tasks requiring multi-step reasoning.", implications: "This could dramatically increase the efficiency of AI systems, allowing smaller models to achieve better results", relatedTechnologies: [ "Model Compression", "Efficient AI", "Chain-of-Thought" ] } ] }, hidden: false },
    { id: "break5_2", type: "breakthrough", parentId: "cat5", data: { title: "ADAS", date: "Mar 2025", color: "green", organization: "Jeff Clune et al.", summary: "Meta-agent that writes and improves other agents' code, discovering novel designs", source: "https://arxiv.org", isExpanded: false, details: "Automated Design of Agentic Systems (ADAS) generates code for candidate agents, tests their performance on tasks, and iteratively improves them. Meta Agent Search writes new agent programs, keeps an archive of the best ones, and continually refines on multiple domains." }, hidden: false },
    { id: "break5_3", type: "breakthrough", parentId: "cat5", data: { title: "Function Calling API", date: "Mar 3025", color: "green", organization: "OpenAI", summary: "Allows a ChatGPT agent to invoke multiple tools in one prompt for complex actions", source: "https://openai.com", isExpanded: false, details: "This API update effectively let a ChatGPT-based agent juggle multiple tools or functions in one conversation turn. A single agent can act like a coordinator, invoking different APIs (search, calculator, etc.) one after another without human prompts." }, hidden: false },
];

// 导出时自动分配 gridPosition 并转为 position，去除 parentId 字段
export const initialNodes = addOnExpandToNodeData(
    gridToPosition(
        assignGridPositions(baseNodes).map(node => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { parentId, ...rest } = node;
            return rest;
        }),
        2 // rowGap
    )
);

export const initialEdges: Edge[] = [
    { id: "e-root-cat1", source: "root", target: "cat1", animated: true },
    { id: "e-root-cat2", source: "root", target: "cat2", animated: true },
    { id: "e-root-cat3", source: "root", target: "cat3", animated: true },
    { id: "e-root-cat4", source: "root", target: "cat4", animated: true },
    { id: "e-root-cat5", source: "root", target: "cat5", animated: true },

    { id: "e-cat1-break1_1", source: "cat1", target: "break1_1" },
    { id: "e-cat1-break1_2", source: "cat1", target: "break1_2" },
    { id: "e-cat1-break1_3", source: "cat1", target: "break1_3" },

    { id: "e-cat2-break2_1", source: "cat2", target: "break2_1" },
    { id: "e-cat2-break2_2", source: "cat2", target: "break2_2" },
    { id: "e-cat2-break2_3", source: "cat2", target: "break2_3" },

    { id: "e-cat3-break3_1", source: "cat3", target: "break3_1" },
    { id: "e-cat3-break3_2", source: "cat3", target: "break3_2" },
    { id: "e-cat3-break3_3", source: "cat3", target: "break3_3" },

    { id: "e-cat4-break4_1", source: "cat4", target: "break4_1" },
    { id: "e-cat4-break4_2", source: "cat4", target: "break4_2" },
    { id: "e-cat4-break4_3", source: "cat4", target: "break4_3" },

    { id: "e-cat5-break5_1", source: "cat5", target: "break5_1" },
    { id: "e-cat5-break5_2", source: "cat5", target: "break5_2" },
    { id: "e-cat5-break5_3", source: "cat5", target: "break5_3" },
];
