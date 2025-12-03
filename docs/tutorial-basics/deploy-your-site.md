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
- Test Strategy
- Functional Test Scenarios
- Unit Test Scenarios
- Integration Test Scenarios
- Performance Test Scenarios
- End-to-End Test Scenarios
- Test Automation Recommendations
- Acceptance Criteria & Test Cases
- Risk-Based Testing

Note: You can find detailed documentation of test scenarios in **Testing Guide** 








