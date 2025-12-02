---
sidebar_position: 3
---

# Coding Standards
Here is a guide to common coding standards and structural conventions for a professional Ruby on Rails application, often used to ensure:
- Maintainability
- Readability  
- Consistency across development teams.

## Ruby and Rails Conventions
These standards generally align with the community-adopted RuboCop and Ruby Style Guide.

### Naming Conventions

| Component | Convention | Example |
| :--- | :--- | :--- |
| **Classes/Modules** | `CamelCase` | `class UserController` |
| **Methods/Variables** | `snake_case` | `def load_user_data` |
| **Instance Variables** | Starts with `@` | `@current_user` |
| **Class Variables** | Starts with `@@` (Avoid if possible) | `@@global_counter` |
| **Constants** | `ALL_CAPS` | `MAX_USERS = 100` |
| **Database Tables** | `snake_case`, plural | `user_profiles` |
| **Model Files** | `snake_case`, singular | `user_profile.rb` |


### Method Signatures and Syntax
- Parentheses: Omit parentheses for method calls when the method is passed no arguments.  
- Use parentheses for clarity, especially in complex expressions or when defining the method.
  - Bad: puts("Hello")
  - Good: puts "Hello"
- Predicate Methods: Methods that return a boolean value should end with a question mark (?).
  - Example: user.active?
- Bang Methods: Methods that modify the object in place (mutate) should end with an exclamation mark (!).
  - Example: user.save! (saves and raises an error if validation fails)
- Default Arguments: Use spaces around the equal sign (=) in default method arguments.
  - Example: def log(message, level = :info)

### Logic and Flow Control
- unless: Prefer unless for the negative case over if !.
   - Bad: if !user.admin?
   - Good: unless user.admin?
- Ternary Operator: Use the ternary operator (? :) for simple conditional assignments. Avoid nesting them.
   - Example: status = user.active? ? "Online" : "Offline"
- Modifiers: Use the modifier form of control structures (if, unless, while) when the body is a single line.
   - Example: return if user.banned?
- Blocks: Use curly braces ({}) for single-line blocks and do...end for multi-line blocks.
   - Single-line: [1, 2, 3].map `{ |n| n * 2 }`
   - Multi-line:
    ```
    users.each do |user|
      # ... logic ...
    end
    ```

---

## Rails Application Structure

The standard Rails directory structure (MVC) is the foundation. Adherence to this structure is essential for Rails' "Convention over Configuration" philosophy.

### app/ Directory
This directory holds the core Model-View-Controller architecture.

| Folder | Role/Standard | Best Practice/Example |
| :--- | :--- | :--- |
| **app/models** | Models: Business logic, database interactions, validations, and associations. Keep models **skinny** (not bloated). | Use **scopes** for reusable queries (e.g., `scope :active, -> { where(active: true) }`). |
| **app/controllers** | Controllers: Handle requests, interact with models, and prepare data for views. Keep controllers **skinny** (follow **'Single Responsibility Principle'**). | Only define the seven **RESTful actions** (`index`, `show`, `new`, `create`, `edit`, `update`, `destroy`). Extract complex logic into Service Objects or Modules. |
| **app/views** | Views: Presentation layer, containing ERB/HTML. | Avoid putting any complex logic here. Use **Helper Methods** for formatting. Utilize **Partials** (`_filename.html.erb`) for reusable segments. |
| **app/helpers** | Helper methods used by views (and sometimes controllers). | Group related helpers into specific modules (e.g., `UsersHelper`). |
| **app/services** (Optional) | Service Objects: Custom directory for business logic that doesn't fit in the Model or Controller (e.g., payment processing, complex report generation). | Typically **single-method classes** (often `call` or `execute`). |

### config/ Directory
- routes.rb: Define routes clearly and use built-in helpers like resources whenever possible. Avoid overly verbose custom routes.
- Environment Files: Keep configuration separate from code. Use environment variables (e.g., in .env or using secrets management) for sensitive data (API keys, passwords).

### lib/ Directory
- Custom Libraries/Modules: Use this for code that doesn't belong in app/ but is still domain-specific (e.g., third-party API wrappers, custom integration logic).

### Database (Migrations)
- Irreversibility: Ensure that destructive migrations (e.g., dropping a table or column) are handled carefully, ideally with the use of the up/down methods or reversible block if change is insufficient, to allow for rollback.
- Foreign Keys: Always use foreign key constraints where appropriate to maintain data integrity.

