# Mermaid Diagram - UI Components

You are an experienced software architect tasked with creating a Mermaid diagram to visualize the architecture of Astro pages and React components for the login and registration module. The diagram should be created in the following file: DESTINATION

You will need to refer to the following files to understand the existing components:

<file_references>
`.ai/prd.md`
</file_references>

<destination>
.ai/diagrams/ui.md in English
</destination>

Your task is to analyze the specifications of the login and registration module and create a comprehensive Mermaid diagram that accurately represents the system architecture. The diagram should be in English.

Before creating the diagram, analyze the requirements and plan your approach. Place your analysis within the `<architecture_analysis>` tags. In this analysis:

1. List all components mentioned in the reference files.
2. Identify the main pages and their corresponding components.
3. Determine the data flow between components.
4. Provide a brief description of each component's functionality.

When you are ready to create the diagram, follow these guidelines:

1. Start the diagram with the following syntax:

   ```mermaid
   flowchart TD
   ```

2. Include the following elements in your diagram:

   - Updated UI structure after implementing new requirements
   - Layouts, server pages, and updates to existing components
   - Grouping of elements by functionality
   - Direction of data flow between components
   - Modules responsible for application state
   - Division into shared components and page-specific components
   - Dependencies between authentication-related components and the rest of the application
   - Highlight components that required updates due to new requirements

3. Follow these Mermaid syntax rules:

   - Use consistent node ID formatting:
     ```
     A[Main Panel] --> B[Login Form]
     B --> C[Data Validation]
     ```
   - Remember that node IDs are case-sensitive and must be unique.
   - Use correct node shapes:
     - `[Text]` for rectangles
     - `(Text)` for rounded rectangles
     - `((Text))` for circles
     - `{Text}` for diamonds
     - `>Text]` for flags
     - `[[Text]]` for subprograms
   - Group related elements using subgraphs:
     ```
     subgraph "Authentication Module"
       A[Login Form]
       B[Data Validation]
       C[Session Management]
     end
     ```
   - Use intermediary nodes for complex relationships instead of overly complicated connections.
   - Prefer vertical layouts for hierarchies and horizontal layouts for process flows.
   - Use correct connection types:
     - `-->` for standard arrows
     - `---` for lines without arrows
     - `-.->` for dotted lines with arrows
     - `==>` for thick lines with arrows
     - `--Text-->` for labeled arrows
   - Avoid using URLs, endpoint addresses, brackets, long function names, or complex expressions in node names.
   - Use consistent naming throughout the document.
   - Avoid long labels that may cause rendering issues.
   - Use quotes for text containing spaces:
     ```
     A["Authentication Component"] --> B["State Management"]
     ```
   - For node styling, use the correct syntax:
     ```
     A:::styleClass --> B
     ```
     with the class definition:
     ```
     classDef styleClass fill:#f96,stroke:#333,stroke-width:2px;
     ```

4. Avoid these common mistakes:
   - Missing Mermaid section declaration and diagram type at the beginning
   - Invalid node IDs (containing disallowed characters)
   - Unclosed subgraphs (missing "end" for an opened "subgraph")
   - Unclosed square brackets in node descriptions
   - Inconsistent flow directions (mixing TD and LR without justification)
   - Overly complex diagrams without proper grouping
   - Overlapping labels and connections

After creating the diagram, review it thoroughly to ensure there are no syntax errors or rendering issues. Make necessary adjustments to improve clarity and accuracy.

When you are ready to present the final diagram, enclose it within `<mermaid_diagram>` tags.