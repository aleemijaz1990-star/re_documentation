---
sidebar_position: 3
---

# New Developer Onboarding
## Overview
Relevant is a Rails‑backed, Angular‑fronted analytics and engagement platform for multi‑office healthcare or retail organizations. It exposes dashboards, call‑center tools, media buys, nudges, billing, and office management via a SPA that hits JSON APIs on a Rails backend . The main Rails app module is Rws, and deployments target AWS Elastic Beanstalk using Docker and Nginx/Passenger 
## Prerequisites
You should have these installed locally:

- **Ruby** compatible with Rails 7.1 (see Gemfile) .
- **Bundler** (version controlled via gem install bundler -v 2.5.7 in Dockerfile) .
- **PostgreSQL** (see config/database.yml) .
- **Node.js + npm** and optionally **Yarn** (AngularJS assets use Sprockets; Angular CLI app uses Node).
- **@angular/cli** (if working on /client, see ngbuild.sh and client/README.md) .
- **Docker** (optional but recommended; see Dockerfile and docker-compose.yml) .

## Getting the app running locally
### Backend (Rails)
1. Install gems:
```
1  bundle install
```
2. Configure database:
- config/database.yml expects rwsdb_dev, rwsdb_test, rwsdb_prod databases and uses env vars for user/password or defaults (appuser/devdb) .
- Create and migrate:
```
1  rails db:create
2  rails db:migrate
```
if you have database dump then make an instance of PostgreSQl in docker by running these commands in console
```
1 docker run --name relevant-db \
    -e POSTGRES_USER=appuser \
    -e POSTGRES_PASSWORD=devdb \
    -e POSTGRES_DB=rwsdb_dev \
    -p 5432:5432 \
    -d postgres:14.1
2  docker exec -i relevant-db POSTGRES_PASSWORD="devdb" pg_restore -U appuser -d rwsdb_dev --clean --no-owner < rwsdb_dev.sql

```
3. Go to rails console and run the following code
```
ClientsPeople.delete_all
PeopleRoles.delete_all
PersonAuthorization.delete_all
mhc = Client.find_by(nickname: 'mhc')
ad = Role.find_by_name('Administrator')
us = Role.find_by_name('User')
pl = Person.create(name: 'Hamza Khan') # your name here.
ClientsPeople.create(client_id: mhc.id, person_id: pl.id)
PeopleRoles.create(person_id: pl.id, role_id: ad.id)
PeopleRoles.create(person_id: pl.id, role_id: us.id)
PersonAuthorization.create(person_id: pl.id, email: 'mark@relevantinc.com') # write your Google email here
```
4. Run the Rails server

```
1   rails server
```
- The root route is application#index, which loads the SPA shell


## Frontend – AngularJS (classic UI)

The AngularJS app is bundled via Rails assets:

- app/assets/javascripts/application.js is the Sprockets manifest and pulls in Angular, UI Bootstrap, ApexCharts, and the app code under app/assets/javascripts
- No separate build step is needed beyond Rails asset compilation in development (config.assets.debug = true in dev)

With rails server running, visit the root URL; AngularJS routes are configured in app/assets/javascripts/app/config/route_provider.js.coffee


## Frontend – Angular (client/)
f you work on the newer Angular app:

 1. In client/:
```
1 cd client
2 npm install
3 ng serve
```
- See client/README.md for details (build, tests, e2e)

## Configuration and environments
### Rails environments
- Development: config/environments/development.rb enables code reloading, mem_cache_store, and allows all hosts for ngrok usage .
- Test: config/environments/test.rb configures static assets and disables forgery protection for tests .
- Production: config/environments/production.rb enables caching, asset compression, digests, and sets memcached cache_store and HSTS/CSP at Nginx level 

### Secrets and credentials
- Database credentials are read from environment variables in config/database.yml .
- Third‑party credentials (Twilio, AWS, Pusher, Datadog, etc.) are pulled from Rails.application.credentials or environment variables in various initializers and Docker/EB configs 
- .ebignore and .ebextensions manage what is deployed and which env vars are exposed to the app 

## Code layout
### Backend

- Controllers:
  - UI: ApplicationController serves templates like /application/home/landing, /application/offices/landing etc. 
  - API: app/controllers/api/*, e.g., Api::ClientController, Api::PhoneController, Api::ChannelController, Api::BillingController with before_action :authorize_user and JSend responses 

- Queries / services:
  - Complex campaign cohort queries live in app/queries/campaigns/*.rb like GetCnsCampaigns, GetNsCampaigns, GetCanceledApptCampaigns 
  - Integrations with external services (Pusher, Twilio) live in app/services/* like PusherBase, PusherTextsService 

- Migrations & analytics views:
  - Materialized views for analytics (e.g., mv_channel_responses, mv_roi_campaigns) are maintained in db/migrate/* with large SQL execute blocks and proper indexes 

- Custom extensions:
 - lib/core_ext/string.rb and lib/core_ext/nil_class.rb add to_b to String and NilClass .


## Running Tests

- Rails: look for spec/ or test/ directories; with configuration using RSpec or Minitest, you can run:

```
1 rails test
2 # or
3 bundle exec rspec
```
(adjust based on what your local repo uses).

- Angular (client): use the CLI commands from client/README.md:
```
1  cd client
2  ng test      # unit tests
3  ng e2e       # end-to-end tests (once an e2e runner is configured)

```


