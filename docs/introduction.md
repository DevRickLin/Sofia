# S.O.F.I.A. Introduction

## Description
S.O.F.I.A. (Search-Oriented Functional Intelligence Agent) is an advanced AI-powered agent framework designed to transform how users research, learn, and organize information. By integrating sophisticated AI technologies with search capabilities, S.O.F.I.A. turns scattered content into visual knowledge maps that make complex information more accessible and understandable. The system is built on a modular architecture that ensures extensibility and maintainability, making it adaptable to various use cases and requirements.

## Key Features:
1. **Smart Information Processing**:
   a. **Visual Knowledge Maps**: Transforms complex information into interactive knowledge maps instead of endless text.
   b. **Organized Conversations**: Each topic gets its own thread, eliminating the need to scroll through mixed conversations.
   c. **Automatic Updates**: Tracks topics of interest and adds new information to maps automatically.

2. **Search and Information Retrieval**:
   a. **Google Search Integration**: Performs web searches based on user queries using SerpApi.
   b. **Structured Results**: Extracts structured information like titles, links, and summaries from search results.

3. **Content Analysis**:
   a. **Article Quality Assessment**: Evaluates content quality across 12 different dimensions.
   b. **Text Coherence Analysis**: Analyzes text for coherence, argument completeness, and language quality.
   c. **Content Depth Evaluation**: Assesses information density, analysis depth, and reasoning quality.

4. **Technical Capabilities**:
   a. **Agent Communication**: Uses A2A (Agent-to-Agent) protocol for seamless agent communication.
   b. **Tool Integration**: Implements MCP (Model Context Protocol) for tool management.

5. **Flexibility and Adaptability**:
   a. **Multiple Interfaces**: Offers both CLI and Web interfaces for different user preferences.
   b. **Modular Design**: Features independent components that can be extended or modified.
   c. **Configurable Parameters**: Allows customization of search parameters, model selection, and more.

## Use Cases:
1. **Research and Learning**:
   a. **Example**: A researcher organizing findings from multiple sources into coherent knowledge maps.

2. **Information Organization**:
   a. **Example**: A student creating visual maps of interconnected concepts and ideas.

3. **Content Evaluation**:
   a. **Example**: An editor assessing article quality across multiple dimensions before publication.

4. **Data-Driven Decision Making**:
   a. **Example**: A business professional gathering and organizing information to make informed decisions.

## Technical Architecture:
- **Agent Service**: Core component using Agno for agent orchestration.
- **MCP Tool Services**: Specialized tools including Search Tool.
- **A2A Protocol Implementation**: Enables seamless communication between agents.
- **Multiple User Interfaces**: CLI for quick testing and development, Web interface for rich graphical interaction.

## Workflow Diagram:
```mermaid
sequenceDiagram
    participant User
    participant WebUI as Web Interface
    participant A2AService as A2A Service
    participant Sofia as SOFIA Agent
    participant SearchTool as Search Tool
    participant ExaAPI as Exa API
    participant OpenAI as OpenAI API
    
    User->>WebUI: "I need to understand NFT market trends for digital art"
    WebUI->>A2AService: Send research query
    A2AService->>Sofia: Forward query to agent
    
    Sofia->>Sofia: Analyze initial query
    Sofia->>SearchTool: Call guide_user_detail(query="NFT market trends for digital art")
    SearchTool->>OpenAI: Process prompt with specific guidance questions
    OpenAI->>SearchTool: Return generated guidance
    SearchTool->>Sofia: Return specific questions for clarification
    
    Sofia->>A2AService: Ask for specific details about the query
    A2AService->>WebUI: Display clarification questions
    WebUI->>User: "Could you specify: 1) Time period of interest? 2) Geographic regions? 3) Price ranges? 4) Specific art styles or categories?"
    
    User->>WebUI: "Last 6 months, global market, focusing on generative AI art"
    WebUI->>A2AService: Send refined query
    A2AService->>Sofia: Forward refined details
    
    Sofia->>SearchTool: Call split_query_to_dimension(query="NFT market trends for digital art, last 6 months, global market, generative AI art")
    SearchTool->>OpenAI: Process prompt with dimensional analysis
    OpenAI->>SearchTool: Return JSON with multiple dimensions
    SearchTool->>Sofia: Return structured dimensions for search
    Note over Sofia,SearchTool: Dimensions: Market statistics, Pricing trends, Popular platforms, Artist success factors, Technological innovations
    
    par Search across multiple dimensions
        Sofia->>SearchTool: search_web("NFT market statistics generative AI art last 6 months")
        SearchTool->>ExaAPI: Execute search request
        ExaAPI->>SearchTool: Return search results with full text
        SearchTool->>OpenAI: Generate summary for each result
        OpenAI->>SearchTool: Return concise 3-5 sentence summaries
        SearchTool->>Sofia: Return structured search data with summaries
    and
        Sofia->>SearchTool: search_web("NFT pricing trends generative AI art global market")
        SearchTool->>ExaAPI: Execute search request
        ExaAPI->>SearchTool: Return search results with full text
        SearchTool->>OpenAI: Generate summary for each result
        OpenAI->>SearchTool: Return concise 3-5 sentence summaries
        SearchTool->>Sofia: Return structured search data with summaries
    and
        Sofia->>SearchTool: search_web("Popular NFT platforms for generative AI art")
        SearchTool->>ExaAPI: Execute search request
        ExaAPI->>SearchTool: Return search results with full text
        SearchTool->>OpenAI: Generate summary for each result
        OpenAI->>SearchTool: Return concise 3-5 sentence summaries
        SearchTool->>Sofia: Return structured search data with summaries
    end
    
    Sofia->>Sofia: Process, filter and organize information
    Sofia->>Sofia: Create structured knowledge map with links between concepts
    
    Sofia->>A2AService: Return comprehensive research results with visual map
    A2AService->>WebUI: Display interactive knowledge map
    WebUI->>User: Present interactive knowledge map showing:
    Note over WebUI,User: 1. Market size and growth statistics with sources
    Note over WebUI,User: 2. Price trend visualization by platform and art category
    Note over WebUI,User: 3. Platform comparison with pros/cons for generative AI art
    Note over WebUI,User: 4. Notable generative AI artists and their success patterns
    Note over WebUI,User: 5. Technical innovations driving the market
    
    User->>WebUI: Click on "Platform comparison" node
    WebUI->>User: Expand detailed platform data with source links
```