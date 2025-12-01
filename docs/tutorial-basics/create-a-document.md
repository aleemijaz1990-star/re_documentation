---
sidebar_position: 2
---

# Hosting & Deployment
This  document describes how the Relevant app is hosted and deployed in production

## High‑level hosting architecture

Relevant is deployed on AWS Elastic Beanstalk using the “Docker running on 64‑bit Amazon Linux 2” platform
- The app is packaged as a Docker image built from the project’s Dockerfile .
- Nginx + Passenger inside the container serve the Rails app, with configuration in site_dev.conf and site_prod.conf .
- Elastic Beanstalk configuration and environments are defined in .elasticbeanstalk/config.yml .
- Platform hooks under .platform/ adjust Docker networking, Datadog, and Nginx/CloudWatch integration .

## Docker container build

### Dockerfile

The Dockerfile builds a Phusion Passenger‑based image with Ruby, Node, Nginx, and the app code

- **Base image:** phusion/passenger-customizable:3.0.2 with ports 80 and 4200 exposed.
- **Language/runtime setup:**
  - Installs Ruby 3.3 (/pd_build/ruby-3.3.0.sh) and sets it as default with RVM .
  - Installs Node.js (/pd_build/nodejs.sh) and memcached (/pd_build/memcached.sh) .
- **Passenger and OS packages:**
  - Adds Phusion Passenger Enterprise APT repo and license, installs libnginx-mod-http-passenger-enterprise, libpq-dev, zip, tzdata, wget, and a legacy libssl1.1 package .
  - Enables Nginx and memcached services by removing their down files .
- **Ruby/Rails and Node tooling:**
  - Installs nokogiri and rails 7.1.3.2 .
  - Installs global yarn and @angular/cli@16.2.12, then rebuilds node-sass .
- **App code and gems:**
  - Sets WORKDIR /home/app and COPY . /home/app into the container .
  - Makes /home/app/log writable and installs bundler -v 2.5.7, followed by bundle install .
- **Init script:**
  - Copies start.sh into /etc/my_init.d/start.sh and marks it executable so it runs at container start .
- **Cleanup:**
  - Cleans APT cache and temp directories to reduce image size .
  - The container command is CMD ["/sbin/my_init"], which is standard for Phusion Passenger images and runs init scripts (including start.sh) .

## Web server and Passenger configuration

Nginx + Passenger settings are in site_dev.conf and site_prod.conf .

### Dev configuration (site_dev.conf)
- Listens on port 80, server_name localhost, root /home/app/public.
- Enables Passenger with:
  - passenger_ruby /usr/bin/ruby3.3.
  - passenger_app_env development.
  - passenger_min_instances 2, passenger_thread_count 50.
- Sets client_max_body_size 20M.
- passenger_pre_start http://localhost/ warms the app on startup.

### Prod configuration (site_prod.conf)
- Similar to dev but uses passenger_app_env production.
- Adds asset caching block:

```
1    location ~ ^/assets/ {
2      expires 1y;
3      root /home/app/public;
4      gzip_static on;
5      add_header Cache-Control public;
6      add_header ETag "";
7      break;
8    }
```
to serve precompiled assets with long‑lived cache headers .

### EB platform Nginx snippets

- platform/nginx/conf.d/proxy.conf sets global proxy_read_timeout 1800s and client_max_body_size 20M .
- .platform/nginx/conf.d/security.conf hardens Nginx with server_tokens off, HSTS, and a basic CSP (upgrade-insecure-requests) .

## Elastic Beanstalk configuration

### EB application and environments
.elasticbeanstalk/config.yml wires branches to EB environments .

- application_name: rws.
- default_platform: Docker running on 64bit Amazon Linux 2.
- default_region: us-west-2.
- Branch defaults:
  - master → rws-env.
  - angular_upgrade → rws-stage-env2.

EB uses these settings when you run eb deploy from each branch.

### EB ignore rules

- .ebignore controls which files are deployed to Elastic Beanstalk .
- Excludes:
  - Local .bundle, SQLite files, logs, tmp, .idea, .elasticbeanstalk/app_versions, config/master.key, Angular build outputs under app/assets/javascripts/angular2, and generated public/*.js/public/*.css assets.
- This helps avoid shipping local artifacts and sensitive keys.

### EB extensions
.ebextensions/99datadog.config sets Datadog environment variables and a container command .
- Exposes DATADOG_API_KEY, DD_SITE, DD_LOGS_ENABLED, DD_APM_ENABLED, and various envs used by config/initializers/datadog.rb .
- Container command chmod 666 /var/run/docker.sock changes Docker socket permissions inside EB environment.

Another EB extension (ssl.config, not shown but referenced by ssl/readme.txt) is used to embed SSL certificate chain in the EB environment; ssl/readme.txt documents the renewal steps .


## Platform hooks and logging
Hooks under .platform/hooks customize the EC2/EB environment before and after deployment .

- Prebuild: 01-docker-network.sh:
  - Ensures a Docker network named rws_net exists (docker network create rws_net) used by docker-compose and possibly other containers.
- Predeploy: 99_kill_dd.sh:
  - Stops and removes any host‑level Datadog agent, so only the containerized agent runs.
- Postdeploy: 02-logs-streamtocloudwatch.sh:
  - Configures CloudWatch Agent to ship /var/log/secure logs to a log group /aws/elasticbeanstalk/rws-env/var/log/secure and appends this config to the main EB CloudWatch agent config .

## Rails configuration for hosting
config.ru is standard Rack bootstrapping:
```
1  require ::File.expand_path('../config/environment',  __FILE__)
2  run Rails.application
```
which Passenger/Nginx uses to load the Rails app .

rails.conf lists environment variables that Nginx/Passenger will pass through to the app process, mainly DB, Pusher, and Datadog settings .

## Datadog APM and logging
- Datadog tracing is configured in config/initializers/datadog.rb, instrumenting Rails and ActiveRecord and targeting host DD_AGENT_HOST (default datadog-agent) on port 8126 .
- Datadog container in docker-compose.yml is configured with environment variables and a volume mapping ./log:/app/log, plus a datadog-agent/conf.d/rails.d/conf.yaml log configuration that tails /app/log/production.log .

## Local hosting with Docker Compose
docker-compose.yml defines a local multi‑container setup .

### web service
- build: . builds from the same Dockerfile used in EB.
- Port mapping: 80:80 and 4200:4200 for HTTP and Angular dev server, respectively.
- Mounts project root into /home/app with volumes: - .:/home/app.
- Exposes many environment variables (DB, Rails master key, Pusher, Datadog, etc.), relying on the host environment for values.

### datadog-agent service
- Uses gcr.io/datadoghq/agent:latest.
- Configures APM and logs, reading DATADOG_API_KEY and DATADOG_ENV from the host .
- Binds Docker socket, /proc, cgroups, and mapped logs.

### Shared network
- Uses an external Docker network named rws_net, which the prebuild hook also ensures for EB .

## SSL and certificates
SSL management is partially documented in ssl/readme.txt .

- Renew SSL cert through ssls.com.
- Copy new cert files into ssl/.
- Update the certificate reference (line 42) in .ebextensions/ssl.config with the new .crt file.
- Redeploy via eb deploy to apply the updated certificate.

### Summary: deployment workflow
A typical production deployment flow:

- Prepare code:
  - Merge changes into master or another branch mapped to EB environment in .elasticbeanstalk/config.yml .
- Build and deploy via EB:

```
1  eb deploy             # from the appropriate branch
```
- EB:
  - Builds the Docker image from Dockerfile.
  - Starts container(s) with Nginx + Passenger, runs start.sh init.
  - Applies .platform hooks for Docker network, Datadog cleanup, and CloudWatch logging.
- Verify:
  - Hit the EB environment URL.
  - Check Datadog dashboards/APM and CloudWatch log groups (/aws/elasticbeanstalk/rws-env/...) for issues.


    