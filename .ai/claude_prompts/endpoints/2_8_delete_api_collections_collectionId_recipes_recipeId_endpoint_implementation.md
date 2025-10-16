Your task is to implement a REST API endpoint based on the provided implementation plan. Your goal is to create a solid and well-organized implementation that includes appropriate validation, error handling, and follows all logical steps described in the plan.

First, carefully review the provided implementation plan:

<implementation_plan>
`.ai/claude_prompts/endpoints/2_8_delete_api_collections_collectionId_recipes_recipeId_view_implementation_plan.md`
</implementation_plan>

<types>
`src/types.ts`
</types>

<implementation_rules>
`.ai/claude_rules/backend.md`
`.ai/claude_rules/shared.md`
</implementation_rules>

<implementation_approach>
Using Plan Mode, prepare detailed plan for implementing the REST API endpoint based on the provided context, then sumarize it and wait for feedback before proceeding with implementation.
</implementation_approach>

Now perform the following steps to implement the REST API endpoint:

1. Analyze the implementation plan:
   - Determine the HTTP method (GET, POST, PUT, DELETE, etc.) for the endpoint.
   - Define the endpoint URL structure
   - List all expected input parameters
   - Understand the required business logic and data processing stages
   - Note any special requirements for validation or error handling.

2. Begin implementation:
   - Start by defining the endpoint function with the correct HTTP method decorator.
   - Configure function parameters based on expected inputs
   - Implement input validation for all parameters
   - Follow the logical steps described in the implementation plan
   - Implement error handling for each stage of the process
   - Ensure proper data processing and transformation according to requirements
   - Prepare the response data structure

3. Validation and error handling:
   - Implement thorough input validation for all parameters
   - Use appropriate HTTP status codes for different scenarios (e.g., 400 for bad requests, 404 for not found, 500 for server errors).
   - Provide clear and informative error messages in responses.
   - Handle potential exceptions that may occur during processing.

4. Testing considerations:
   - Consider edge cases and potential issues that should be tested.
   - Ensure the implementation covers all scenarios mentioned in the plan.

5. Documentation:
   - Add clear comments to explain complex logic or important decisions
   - Include documentation for the main function and any helper functions.

After completing the implementation, ensure it includes all necessary imports, function definitions, and any additional helper functions or classes required for the implementation.

If you need to make any assumptions or have any questions about the implementation plan, present them before writing code.

Remember to follow REST API design best practices, adhere to programming language style guidelines, and ensure the code is clean, readable, and well-organized.
