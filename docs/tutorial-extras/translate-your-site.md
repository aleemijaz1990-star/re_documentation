---
sidebar_position: 2
---

# System Architecture

## High-Level System Architecture
The application follows a Monolithic Architecture based on the Model-View-Controller (MVC) pattern, but is primarily focused on serving data via an API. It employs a Service Layer to keep the core MVC components clean and enforce business logic consistency.

### Architectural Layers
- Client/Frontend: (Outside the scope of the backend) Sends authenticated HTTP requests to the API.
- API Gateway/Load Balancer: (External) Routes requests to available application servers.
- Application Layer (Rails): The core of the system, responsible for routing, authentication, and request handling.
- Service/Business Logic Layer: Houses complex, reusable business processes, abstracted from controllers and models.
- Data Layer (PostgreSQL): Stores and manages persistent data, optimized with features like Materialized Views.


---

## Core Components and Technology Stack


| Component | Technology/Pattern | Detail/Purpose |
| :--- | :--- | :--- |
| **Backend Framework** | **Ruby on Rails** | Provides the MVC structure, routing, and ORM (Active Record). |
| **API Standard** | **RESTful + JSend** | Defines endpoints based on resources and uses the **JSend format** (`{status: 'success', data: {}}`) for consistent API responses. |
| **Database** | **PostgreSQL** | Primary datastore, chosen for its advanced features (e.g., materialized views, advanced querying with JSON/SQL functions). |
| **Authorization** | **Role-Based Access Control (RBAC)** | Custom logic (`authorize_user`) using roles (e.g., "Administrator," "System Administrator") to restrict endpoint access based on user credentials and client ID. |
| **Business Logic** | **Service Objects and Modules** | Used to extract complex workflows (like patient data processing, calculation of dashboard metrics, or message handling) from the controllers and models. |
| **Deployment/Hosting** | (Inferred) **Containerization** (e.g., Docker) | Standard for scalable Rails deployment, typically run behind an NGINX/Puma stack. |


---

## Application Layer Structure
The app/ directory adheres to the following enhanced MVC structure:

| Folder | Responsibility | Key Conventions |
| :--- | :--- | :--- |
| **`app/controllers/api`** | API Interface | All controllers are API-focused (`Api::*`). They are **thin**, primarily handling authorization, parameter sanitization, and delegating work to the Service Layer. |
| **`app/models`** | Data & Core Logic | Models (e.g., Patient, Nudge, Client) contain data validations, associations, and data-centric logic (e.g., scopes, calculated fields). |
| **`app/services`** | Transaction/Business Logic | This directory holds business-critical processes (e.g., `SetRepresentative`, `GetPatients`). Classes often have a single public method (`#call` or `#execute`) and ensure **atomicity**. |
| **`app/modules`** | Cross-Cutting Concerns | Used to include reusable utilities across controllers and models (e.g., `NudgeSubstituter`, `NudgeCountHandler`). |
| **`app/helpers`** | View Helpers | Used for formatting or presentation logic, although less common in pure JSON APIs. |


---

## Data Layer Strategy (PostgreSQL)
Performance and complex reporting drive the database strategy, which heavily utilizes PostgreSQL-specific features.

### Materialized Views
- Usage: For complex, slow, or frequently accessed read queries (e.g., large joins involving patient and phone data).
- Example: mv_patient_phone_name (inferred from patient_controller.rb).
- Maintenance: Views are periodically updated (e.g., concurrently refreshed in a background thread after critical data writes) to ensure data is fresh without blocking application traffic.

### Direct SQL
- Usage: Used within controllers (e.g., billing_controller.rb) for high-performance reporting and aggregation that Active Record may struggle to optimize effectively (e.g., complex window functions, custom date calculations like date_trunc).
- Convention: Use parameter binding (General.find_by_sql [SQL, params]) to prevent SQL injection vulnerabilities.

---

## Security, Monitoring, and Asynchronous Processing

### Security & Authorization
- Authentication: Handled by a dedicated mechanism that sets @authorized_user.
- Authorization: The authorized_client method enforces that the user has the required role and is accessing data tied to their permitted client ID (params[:client_id]).
- Parameter Handling: Uses params.permit() (Strong Parameters) for mass assignment protection and Sanitize.id() for input cleaning (inferred from patient_controller.rb).

### Monitoring and Performance
- Custom Logging: The presence of ErrorLog.create(...) in multiple controllers indicates a custom, centralized error tracking mechanism that captures the endpoint, client, details, and backtrace.
- Performance Tracking: Explicit before_action :start_timer and after_action :end_timer are used to measure API response times for performance auditing.

### Asynchronous Processing
- Background Jobs: Complex or time-consuming operations are pushed off the main request thread to improve user experience (UX) and system throughput.
- Example: Refreshing the materialized view (REFRESH MATERIALIZED VIEW CONCURRENTLY) after a representative is set is executed in a new Thread.new do... block, indicating a crucial use of background processing. (A more robust production system would typically use a dedicated queue like Sidekiq or Resque).

