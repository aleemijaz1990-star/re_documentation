---
sidebar_position: 1
---

# Coding Standards

## Overview
This document outlines the coding standards and best practices for this project. Following these guidelines ensures code consistency, maintainability, and quality across the team.

**Core Principles:**

- Consistency: Follow established patterns
- Readability: Code is read more than written
- Simplicity: Keep it simple, avoid over-engineering
- Maintainability: Future developers should easily understand your code

## General principles
- Prefer clarity over cleverness; keep methods and functions short and focused
- Reuse existing helpers and patterns (e.g., Sanitize, ErrorLog, JSend JSON format) rather than inventing new ones
- Keep all secrets and environment‑specific values out of source; use Rails credentials or environment variables instead

## Ruby / Rails
### Naming and structure
- Use CamelCase for classes/modules and snake_case for methods, variables, and files:
  - Example: class Campaigns::GetTnsCampaigns in app/queries/campaigns/get_tns_campaigns.rb
- Keep query/service objects under appropriate namespaces (e.g., Campaigns::GetCnsCampaigns) and group by domain in app/queries/... 

### Controllers
- Inherit from ApplicationController and use Rails filters consistently:
  - before_action :authorize_user, before_action :start_timer, after_action :end_timer, after_action :authorize_token for API controllers
- Use JSend‑style JSON responses for APIs:

```
1  render json: { status: "success", data: object }
2  render json: { status: "error", message: "Error description" }
```
as seen in multiple controllers (e.g., Api::ClientController, Api::PhoneController)
- Enforce authorization per‑endpoint with role or client checks:
```
1  client = @authorized_user&.authorized_client(params[:client_id], "Administrator")
2  return render json: { status: "error", message: "You are not authorized ..." } unless client
```

### Error handling and logging
- Wrap external service and DB operations in begin/rescue and log via ErrorLog.create with client_id, endpoint, details, and backtrace
- Return generic messages to clients and preserve detailed context in error logs

### Data access and queries
- Use query objects for complex SQL (e.g., Campaigns::GetCanceledApptCampaigns) with:
  - initialize capturing parameters
  - execute as a single public method
- Private query and paginate helpers returning raw ActiveRecord relations or hashes

### Sanitization
- Always sanitize user input using existing helpers (e.g., Sanitize.phone, Sanitize.id, Sanitize.message, Sanitize.date) before using in queries or external APIs (e.g., Twilio, Office endpoints)

## JavaScript / CoffeeScript (AngularJS)

### Module and file organization
- All AngularJS code lives under app/assets/javascripts, compiled via application.js manifest
- Use the shared module rws_app for controllers, directives, filters, and factories (see app/app.js.coffee)

### CoffeeScript style
- Use single quotes for strings and arrow functions (->, =>)
- Name directives, controllers, and factories in camelCase at registration time (e.g., 'prospectTrendGraph', 'BillingCtrl')
- Keep link functions focused; extract helpers as inner functions where appropriate (as seen in cascDataTable, dashGraph)

### Angular directives
- Use element directives (restrict: 'E') and replace: true consistently:
```
1 rws_app.directive 'campaignCreateBtn', ['$compile', ($compile) ->
2    restrict: 'E'
3    replace: true
4    template: '...'
5    scope: true
6    link: (scope, element, attrs) ->
7      # ...
8  ]
```
- Expose inputs via scope with one‑way < bindings and callbacks for events (onRemove, onColumnSelected, etc.) as in cascDataTable, dashGraph, and chart directives

###  Factories and API access
- Use $resource for REST APIs with standardized methods:
```
1 $resource '/api/clients/:client_id/channels/:id/:action', {}, {
2   create:  (method: 'POST',   isArray: false, interceptor: ResourceIntercept)
3   read:    (method: 'GET',    isArray: false, interceptor: ResourceIntercept, cache: true)
4   readf:   (method: 'GET',    isArray: false, interceptor: ResourceIntercept, cache: false)
5   update:  (method: 'PUT',    isArray: false, interceptor: ResourceIntercept)
6   destroy: (method: 'DELETE', isArray: false, interceptor: ResourceIntercept)
7 }

```
as seen in rws_api_channel.js.coffee and similar factories
- Centralize token handling in ResourceIntercept and $httpProvider defaults; do not manually set headers in individual controllers unless needed

### Filters
- Implement reusable UI helpers as Angular filters and keep them pure (no side effects), e.g., TitleCase, ZeroPad, Phone, Percentage, ReadableHeader

## Angular (client/ Angular CLI app)
- Client Angular app (v12) uses default Angular CLI structure and strict TypeScript settings (see client/angular.json and tsconfig.app.json)
- Use:
  - scss for styles
  - Strong typing and strict compiler options per Angular CLI defaults
- Follow Angular style guide for modules, components, and services; keep business logic in services, not components

## SQL, migrations, and data scripts
- For complex reporting, use materialized views created in migrations with large execute blocks (e.g., mv_channel_responses, mv_roi_campaigns) and always add proper indexes (often on client_id)
- Prefer CTEs (WITH clauses) for readability and composability in large SQLs, as seen in many reporting queries and views
- For batch data processing scripts in db/ or lib/, follow the existing pattern:
  - Log progress periodically
  - Use bulk inserts and indexes for large imports
  
## API conventions
- All new JSON APIs should:
  - Use the JSend structure (status, data, message) like existing endpoints .
  - Enforce authentication via authorize_user and client/role checks.
  - Sanitize and permit parameters using params.permit(...) and Sanitize helpers.

## Error and edge‑case handling
- For external services (Twilio, Google Maps, AWS, Pusher, Firebase), always:
  - Wrap calls in begin/rescue
  - Log via ErrorLog.create with minimal user‑facing error messages
- Prefer returning user‑friendly strings
 
## Security‑related standards
- Always retrieve secrets from Rails.application.credentials or environment variables and never hardcode API keys or secrets in code.
- Validate and sanitize all user input, especially for:
  - Phone numbers (Sanitize.phone) .
  - IDs (Sanitize.id).
  - Dates (Sanitize.date).
- Ensure new controllers use CSRF protection defaults, except for legitimate webhook endpoints, which should implement request verification (e.g., Twilio RequestValidator) .
