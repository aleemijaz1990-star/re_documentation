---
sidebar_position: 5
---

# System Architecture

This document describes the overall architecture of the Relevant system: components, data flows, deployment, and key integrations

## High‑level overview
Relevant is a Rails 7 monolith (module Rws) that serves both HTML and JSON to a rich AngularJS SPA, plus a newer Angular (CLI) client. It runs in Docker on AWS Elastic Beanstalk using Nginx + Passenger in front of Rails and PostgreSQL as the primary data store
```
flowchart LR
  User[Browser] --> FE[AngularJS / Angular UI]
  FE --> Rails[Rails app (Controllers, Queries)]
  Rails --> DB[(PostgreSQL)]
  Rails --> Ext[Twilio / AWS / Google / Pusher]
```

## Backend architecture (Rails)
### Application entry points
- config.ru boots the Rails app for Rack/Passenger: run Rails.application .
- config/application.rb defines module Rws and loads Rails, custom core extensions, and environment‑specific configs .

### Controllers and routing
- Routes: config/routes.rb maps:
   - Root / → ApplicationController#index (SPA shell).
   - Numerous GET application/* routes for views like home, clients, configuration, media_buys, reports, leads, billing, offices, nudges, callcenter, etc. .
   - API namespaces like /api/clients/:client_id/... for JSON endpoints (e.g., channels, phones, billing, auto_replies, dashboard) .
- ApplicationController:
   - Serves ERB/HTML templates for the AngularJS SPA (render "/application/.../landing").
   - Implements authentication, token handling, and helper methods (authorize_user, external provider token flows, impersonation) .
- API controllers (app/controllers/api/*):
   - Typical pattern: before_action :authorize_user, before_action :start_timer, after_action :end_timer, after_action :authorize_token with JSend‑style responses.
   - Examples:
     -  Api::ChannelController for channels CRUD per client .
     - Api::PhoneController for Twilio number provisioning and phone management .
     - Api::BillingController for billing summaries .
     - Api::ClientController for client management and default preferences .
     - Api::Client::NudgesAppointmentsController for nudge appointment data .

### Query / service layer
- Query objects under app/queries/campaigns/ encapsulate complex SQL to generate patient lists for campaign workflows:
  - GetCnsCampaigns, GetNsCampaigns, GetCanceledApptCampaigns, etc., each with initialize, execute, and query/paginate helpers returning datasets with pagination metadata .
- Services under app/services/ integrate with external systems:
  - PusherBase, PusherTextsService and related classes drive Pusher notifications for text events, using Pusher env vars configured in initializers .
  - Twilio access token and client generation call Twilio SDK via Rails.application.credentials.twil .

### Data and analytics layer
- Core data in PostgreSQL configured via config/database.yml with separate databases per environment (rwsdb_dev, rwsdb_test, rwsdb_prod) .
- Heavy analytics use materialized views created/updated in migrations:
   - mv_channel_responses aggregates call volumes, prospects, and appointments per DNIS/month/client, joining call_extracts, channels, offices and indexed on client_id .
   - mv_roi_campaigns aggregates campaign ROI per media buy, joining media_buys, campaigns, call_mbs, call_posts/lead/prospect/appointment tables .
   - Additional views like mv_canceled_appt, mv_exp_warranty drive specific nudge/campaign flows .
- Many offline/batch data pipelines and ETL scripts in db/*.rb import external CSV data, dedupe leads, rebuild geographic tables, and push artifacts to S3 / SWF workflows .

## Frontend architecture
Relevant has two frontends:

- Legacy AngularJS SPA served through Rails assets and views.
 - Newer Angular (CLI) app built into public/client and then integrated.

### AngularJS (primary dashboard app)

- Bootstrap: app/assets/javascripts/app/app.js.coffee defines module rws_app and AppCtrl coordinating global auth state, nav, and layout .
- Asset pipeline: app/assets/javascripts/application.js includes Angular, Angular-resource/route/sanitize/cookies, UI‑Bootstrap, ui-select, pivot, Google Chart renderers, smart-table, ApexCharts, then app/app and require_tree . for the rest of JS/Coffee .

- Configuration:
  - $httpProvider defaults set Accept headers, form‑encoded post/put, and CSRF token from meta tags in http_provider.js.coffee .
  - $routeProvider in route_provider.js.coffee maps hash routes (/#/clients, /#/media_buys, /#/offices, /#/billing, etc.) to application/* templates and Angular controllers .
  - $sceDelegateProvider whitelists self and youtube-nocookie.com URLs .
- Factories (app/assets/javascripts/app/factories):
  - $resource factories for each domain: RwsApiClient, RwsApiChannel, RwsApiDashboard, RwsApiOffice, RwsApiBilling, RwsApiNudge, etc., with standardized methods create/read/readf/update/destroy and a shared ResourceIntercept that updates the Authorization header when a token is returned .
- UI layers:
  - Dashboards: directives such as prospectTrendGraph, prospectYearTrend, dashGraph, sparkline, cascDataTable, apexAbTouchStep, etc., which call RwsApiDashboard and render Google Charts / ApexCharts based on JSON from Rails .
  - Offices: controllers and directives OfficesCtrl, officeForm, officeCommForm, officePccForm, exportOfficeLeadsBtn, mapCanvas, etc., for CRUD and mapping using Google Maps DataLayers and overlays .
  - Config: campaignTypeForm, campaignForm plus *_CreateBtn, *_EditBtn, *_DeleteBtn directives for configuration entities .
  - Texts / callcenter / billing: controllers and directives that call corresponding APIs (e.g., BillingCtrl, callcenter download buttons) .

### Angular (CLI) client
- Located under client/ and generated with Angular CLI 12.2.8; build config in client/angular.json with output path ./public/client and strict TypeScript mode .
- ngbuild.sh script builds the Angular app, then runs rails r config.rb, which:
  - Reads public/client/index.html.
  - Extracts style and JS bundle names.
- Writes a minimal app/views/application/index.html that includes those assets and a <div ng-view></div>.
- Moves built assets into public/ and cleans public/client .

## Authentication
- ApplicationController manages JWT‑based auth with AUTH_TOKEN_LIFETIME = 14 days and tokens signed with Rails.application.credentials.secret_key_base .
- Supports multiple providers (Cognito, Google, Apple, Microsoft, “developer”) via helper methods like create_user_token_cognito, create_user_token_google, create_user_token_apple, create_user_token_microsoft, create_user_token_development which validate external tokens and sync PersonAuthorization rows, including refresh tokens .
- authorize_user reads auth header or param, decodes JWT, ensures it is current or refreshes it, then sets @authorized_user for use in controllers; results are cached in Rails.cache for performance .
- Impersonation endpoints allow admins to assume another user’s identity by re‑encoding a token and setting cookies[:auth_token] and cookies[:is_impersonating] .
### Twilio and Telephony
- Twilio integration:
  - Api::PhoneController manages provisioning incoming numbers, updating routing, destroying numbers, validating numbers, generating Twilio Voice JWTs


## Test Scenarios

### 1. Test Strategy Overview
- **Testing Approach and Methodology**: We will use a combination of manual and automated testing. Manual testing will be used for exploratory testing and edge cases, while automated testing will cover regression and integration tests.
- **Test Scope and Objectives**: The primary objective is to ensure the application is functional, reliable, and secure. We will test all major features and components, including the front-end, back-end, and database.
- **Risk Assessment and Mitigation**: High-risk areas include authentication, authorization, and data security. We will perform thorough testing in these areas and implement mitigation strategies as needed.
- **Test Environment Requirements**: The test environment should closely match the production environment. This includes the same hardware, software, and network configurations.

### 2. Functional Test Scenarios
#### Positive Test Cases
- **User Login**: Verify that a user can log in with valid credentials.
- **User Registration**: Verify that a new user can register and receive a confirmation email.
- **Dashboard Access**: Verify that a logged-in user can access the dashboard.
- **Client Management**: Verify that an administrator can add, edit, and delete clients.

#### Negative Test Cases
- **Invalid Login**: Verify that the system handles invalid login attempts gracefully.
- **Duplicate Registration**: Verify that the system prevents duplicate user registrations.
- **Access Denied**: Verify that unauthorized users cannot access restricted areas.

#### Edge Cases
- **Empty Inputs**: Verify that the system handles empty inputs gracefully.
- **Special Characters**: Verify that the system handles special characters in inputs.
- **Large Data Sets**: Verify that the system can handle large data sets efficiently.

#### Business Logic Tests
- **Billing Calculation**: Verify that the billing system calculates charges correctly.
- **Media Buy Management**: Verify that media buys are created, updated, and deleted correctly.

### 3. Unit Test Scenarios
#### Function/Method Testing
- **User Authentication**: Test individual methods for user authentication.
- **Client Management**: Test methods for adding, editing, and deleting clients.

#### Class/Component Testing
- **User Model**: Test the instantiation and methods of the User model.
- **Client Model**: Test the instantiation and methods of the Client model.

#### Mocking and Stubbing
- **External Services**: Mock external services to test internal components.
- **Database Interactions**: Stub database interactions to test business logic.

#### Code Coverage
- **Critical Paths**: Ensure that critical paths are covered by unit tests.
- **Code Complexity**: Focus on complex methods and classes.

### 4. Integration Test Scenarios
#### API Integration
- **User API**: Test API endpoints for user authentication and management.
- **Client API**: Test API endpoints for client management.

#### Database Integration
- **CRUD Operations**: Test create, read, update, and delete operations on the database.
- **Data Consistency**: Verify that data is consistent across the system.

#### Service-to-Service
- **Internal Components**: Test communication between internal components.
- **Third-party Integrations**: Test interactions with third-party services.

### 5. End-to-End Test Scenarios
#### User Journey Testing
- **User Registration**: Test the complete registration process.
- **User Login**: Test the complete login process.
- **Dashboard Access**: Test the complete process of accessing the dashboard.

#### Cross-browser/Platform Testing
- **Chrome**: Test on Google Chrome.
- **Firefox**: Test on Mozilla Firefox.
- **Mobile**: Test on mobile devices.

#### UI/UX Testing
- **Navigation**: Test navigation between different pages.
- **Form Validation**: Test form validation and error messages.
- **Responsiveness**: Test the responsiveness of the application.

#### Data Flow Testing
- **Data Persistence**: Verify that data is persisted correctly.
- **Data Retrieval**: Verify that data can be retrieved correctly.

### 6. Performance Test Scenarios
#### Load Testing
- **Normal Traffic**: Test the system under normal traffic conditions.
- **Peak Traffic**: Test the system under peak traffic conditions.

#### Stress Testing
- **System Limits**: Test the system under extreme conditions to find its limits.

#### Volume Testing
- **Large Data Sets**: Test the system with large data sets.
- **Bulk Operations**: Test bulk operations on the system.

#### Response Time Testing
- **Performance Benchmarks**: Test the system against performance benchmarks.
- **SLA Compliance**: Test the system against SLA requirements.

### 7. Security Test Scenarios
#### Authentication Testing
- **Login**: Test the login functionality.
- **Logout**: Test the logout functionality.
- **Session Management**: Test session management.

#### Authorization Testing
- **Role-based Access**: Test role-based access control.
- **Permissions**: Test permissions for different roles.

#### Input Validation
- **SQL Injection**: Test for SQL injection vulnerabilities.
- **XSS**: Test for XSS vulnerabilities.
- **Data Sanitization**: Test data sanitization.

#### Data Security
- **Encryption**: Test encryption of sensitive data.
- **Privacy Compliance**: Test compliance with privacy regulations.

### 8. Error Handling & Recovery Test Scenarios
#### Exception Handling
- **Graceful Error Responses**: Test graceful error responses.
- **Recovery**: Test recovery from errors.

#### Fallback Mechanisms
- **System Failures**: Test system behavior during failures.
- **Data Integrity**: Test data integrity during errors.

#### User Feedback
- **Error Messages**: Test error messages.
- **User Guidance**: Test user guidance during errors.

### 9. Test Data Requirements
#### Test Data Sets
- **User Data**: Data for user authentication and management.
- **Client Data**: Data for client management.
- **Billing Data**: Data for billing calculations.

#### Data Setup/Teardown
- **Test Environment Preparation**: Prepare the test environment.
- **Cleanup**: Clean up the test environment after testing.

#### Mock Data
- **Synthetic Data**: Use synthetic data for testing.
- **Realistic Data**: Use realistic data for testing.

#### Production-like Data
- **Realistic Scenarios**: Use realistic data scenarios for testing.

### 10. Test Automation Recommendations
#### Automation Strategy
- **Automate Regression Tests**: Automate regression tests to ensure stability.
- **Automate Integration Tests**: Automate integration tests to ensure component interactions.

#### Test Framework Suggestions
- **RSpec**: Use RSpec for unit and integration testing.
- **Capybara**: Use Capybara for end-to-end testing.
- **Selenium**: Use Selenium for cross-browser testing.

#### CI/CD Integration
- **Automated Testing**: Integrate automated testing into the CI/CD pipeline.
- **Continuous Feedback**: Provide continuous feedback on test results.

#### Maintenance Guidelines
- **Keep Tests Updated**: Keep tests updated with changes in the codebase.
- **Test Reliability**: Ensure tests are reliable and maintainable.

### 11. Acceptance Criteria & Test Cases
#### Given-When-Then Scenarios
- **User Registration**: Given a user, when the user registers, then the user should receive a confirmation email.
- **User Login**: Given a user, when the user logs in, then the user should be redirected to the dashboard.

#### Test Case Templates
- **Test ID**: Unique identifier
- **Test Description**: Clear description of what is being tested
- **Preconditions**: Required setup before test execution
- **Test Steps**: Detailed steps to execute the test
- **Expected Results**: What should happen when test passes
- **Test Data**: Required input data and conditions
- **Priority**: High/Medium/Low based on risk and impact

#### Traceability Matrix
- **Requirements**: Link requirements to test cases
- **Test Cases**: Link test cases to requirements

### 12. Risk-Based Testing
#### High-Risk Areas
- **Authentication**: Thoroughly test authentication and authorization.
- **Data Security**: Thoroughly test data security and privacy.

#### Medium-Risk Areas
- **Business Logic**: Thoroughly test business logic and rules.
- **API Integrations**: Thoroughly test API integrations.

#### Low-Risk Areas
- **Basic Functionality**: Thoroughly test basic functionality.
- **UI/UX**: Thoroughly test UI/UX.

For each test scenario, include:
- **Test ID**: Unique identifier
- **Test Description**: Clear description of what is being tested
- **Preconditions**: Required setup before test execution
- **Test Steps**: Detailed steps to execute the test
- **Expected Results**: What should happen when test passes
- **Test Data**: Required input data and conditions
- **Priority**: High/Medium/Low based on risk and impact

Focus on practical, executable test scenarios that ensure quality and reliability. Consider the specific technology stack and common issues in Ruby applications.








