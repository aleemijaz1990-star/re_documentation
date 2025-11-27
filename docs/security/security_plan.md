---
sidebar_position: 1
---

# Security Report
For the complete Security Report click the **[Link](https://security-report-teal.vercel.app/)**, this report includes
- SQL Injection
- XSS
- Mass Assignment
- CSRF
- Insecure redirects
- Missing security configurations

## High‑risk findings (action required)

### Committed secrets and keys

The project contains multiple long‑lived secrets and private keys in source:
- Firebase service account JSON with private key in config/firebase_credentials.json
-  Apple private key in config/apple_sign_in_key.p8
- SSL CSR and related cert files under ssl/ (sensitive when combined with private key elsewhere)
- Passenger Enterprise license in passenger-enterprise-license
- A Google Maps API key hard‑coded in controller actions (geocoding/timezone calls)

**Impact:** If this repo is or has been public, assume these credentials are compromised.

**Recommendations:**
- Immediately rotate all exposed keys (Firebase, Apple, Google Maps, any related cloud/SSL)
- Move all secrets to environment variables / secret manager, and delete them from git history
- Add strict patterns to .gitignore to prevent future accidental commits (you already ignore config/master.key, which is good) 

### Third‑party auth and refresh tokens

**Risks:**
- If secret_key_base or DB are compromised, attackers can mint valid auth tokens and harvest refresh tokens
- Developer token flow reads a local config file (config/dev_credentials.cfg) and grants long‑lived “dev_access” tokens if misconfigured or used in the wrong environment

**Recommendations:**
- Confirm secret_key_base is only in encrypted credentials and never logged
-  Ensure strong rotation policies for all OAuth client secrets
-  Restrict the “developer” provider to non‑production environments and guard with environment checks (you already prevent dev token in production, keep it strict)


## Configuration and transport security

### Session and cookies
- Session store: cookie_store with secure: Rails.env.production? in config/initializers/session_store.rb .
- This means cookies are HTTPS‑only in production, but not in development.

**Recommendations:**
- Keep secure as is; also ensure SameSite and httponly flags are set (consider an explicit initializer if needed).

### HTTP security headers and TLS 

- Nginx security.conf sets server_tokens off, HSTS (Strict-Transport-Security) and Content-Security-Policy upgrade-insecure-requests

**Recommendations:**
- CSP upgrade-insecure-requests is minimal; consider a stricter CSP with explicit script/style sources
- Confirm that HTTPS termination is always used in production and HSTS max‑age is appropriate for your risk appetite

### CORS
- rack-cors is included in Gemfile but I do not see the actual CORS configuration in the snippets provided

**Recommendations:**
- Review your config/initializers/cors.rb (or equivalent) to ensure you are not allowing * origins or overly broad methods/headers in production

## Logging and privacy
- Filtered parameters: only :password is filtered from logs in filter_parameter_logging.rb

**Recommendations:**
- Add additional sensitive keys: :password_confirmation, :token, :access_token, :refresh_token, :secret, :credit_card, etc
- Confirm that request/response logs do not include raw JWTs or third‑party tokens

## API / access control

### Authorization patterns
- API controllers under app/controllers/api/* use before_action :authorize_user and then check role/client via helper methods like authorized_client and in_role?
- Endpoints restrict access by role, e.g., "Administrator", "User", "Engagement", "System Administrator"

**Strengths:**
- Authorization checks are explicit per endpoint, and error messages avoid leaking sensitive detail
- Many actions sanitize input through Sanitize helpers for IDs, messages, and phone numbers before use 

**Recommendations:**
- Ensure all new endpoints follow the same pattern: authorize_user + client/role check
- Consider centralized policies (e.g., Pundit/CanCanCan) if authorization logic grows more complex

### Data exposure via JSON
- Most JSON responses are whitelisted using as_json with :only/:except and nested includes, especially for Offices and AutoReplyText

**Recommendations:**
- Continue using explicit field whitelisting; avoid to_json on whole ActiveRecord objects
- Review that no PII or internal identifiers are unnecessarily exposed to the client

## Infrastructure and observability

### Docker / Datadog
- docker-compose.yml passes many environment variables (DB, Datadog, Pusher, etc.) into containers and a Datadog sidecar
- .ebextensions/99datadog.config also injects Datadog config from EB env vars

**Recommendations:**
- Treat Docker/compose files as non‑public; never commit actual secret values
- Ensure the Datadog agent is not exposing metrics/logs publicly and that tokens are only read from secure env

### Environment segregation
- Separate development, test, and production configs with appropriate caching, asset handling, and host checks

**Recommendations:**
- Confirm production DB and credentials are fully isolated from non‑production
- Use different OAuth clients/keys per environment

## Libraries and attack surface
- Gems include jwt, rest-client, savon, aws-sdk-*, twilio-ruby, angularjs-rails, rack-cors, ddtrace, etc

**Recommendations:**
- Keep all security‑relevant gems updated (jwt, rack-cors, rest-client, aws-sdk, twilio)
- Periodically run bundle audit or similar to detect vulnerable versions

