---
sidebar_position: 4
---

# Extra Services Configuration
Relevant integrates with multiple third-party services for  messages, payments, authorization, and more. This document covers setup, configuration, and best practices for each service.

## Required Services

### Twilio (Real-Time Communications)

**Purpose:** Integrate SMS, in-app calling (Softphone), and programmable voice services for patient/client communication.

**Sign up:** https://www.twilio.com/try-twilio

**Configuration (Backend & Frontend)**
- **Add to** Gemfile **(Backend API calls):**
    ```
    # Gemfile
    gem 'twilio-ruby'
    ```
- **Add to** .env **(Environment variables):**
    ```
    TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    TWILIO_AUTH_TOKEN=your_auth_token_here
    TWILIO_PHONE_NUMBER=+15555555555 # Your purchased Twilio phone number
    ```
- **Configuration in** config/initializers/twilio.rb **(Backend setup):**
    ```
    # config/initializers/twilio.rb
    
    Twilio.configure do |config|
      config.account_sid = ENV['TWILIO_ACCOUNT_SID']
      config.auth_token = ENV['TWILIO_AUTH_TOKEN']
    end
    ```

**Frontend Integration (Client SDK for Softphone):**

The Twilio Client SDK is already loaded in your head to enable in-browser voice and real-time 
- features:
    ```
    <script type="text/javascript" src="//media.twiliocdn.com/sdk/js/client/v1.7/twilio.min.js"></script>
    ```
**Getting Credentials**

- Create an account at https://www.twilio.com/try-twilio.
- Navigate to your Project Dashboard.
- Locate the Account SID and Auth Token.
- Copy and paste these credentials into your .env file (or Rails credentials).

**Usage Limits**

- Trial Account: Limited features, restricted SMS sending to unverified numbers, and usage caps.
- Paid Account: Limits are based on your usage plan and messaging throughput configured for your phone numbers.

**Monitoring Usage**

Dashboard:https://www.twilio.com/console/usage/metrics

**Check:**
- Aggregated usage metrics (e.g., total messages sent, calls made).
- Detailed log history for individual messages and call events.
- Current balance and billing history.

**Alerts:** Set up usage triggers within the Twilio console to receive notifications when spending approaches a set limit.

---

### Pusher (Real-Time Data)

**Purpose:** Provide real-time data updates (e.g., chat, live notifications) to the frontend without constant polling.

**Sign up:** https://pusher.com/signup

**Configuration (Backend & Frontend)**

- **Add** to Gemfile **(Backend):**

  ```
  # Gemfile
  gem 'pusher'
  ```
- **Add to** .env:
  ```
  PUSHER_APP_ID=123456
  PUSHER_KEY=your_public_app_key # This key is often passed to the frontend
  PUSHER_SECRET=your_secret_token
  PUSHER_CLUSTER=us2 # Match the cluster region
  ```
- **Configuration in** config/initializers/pusher.rb **(Backend setup):**
  ```
  # config/initializers/pusher.rb
  
  Pusher.app_id = ENV['PUSHER_APP_ID']
  Pusher.key    = ENV['PUSHER_KEY']
  Pusher.secret = ENV['PUSHER_SECRET']
  Pusher.cluster = ENV['PUSHER_CLUSTER']
  Pusher.logger = Rails.logger
  ```

**Frontend Integration:**

- The Pusher JS library is already included in your code:
  ```
  <script src="https://js.pusher.com/8.0.1/pusher.min.js"></script>
  ```

- Usage Example (Backend):
  ```
  # Used in a Service or Controller after data is saved
  Pusher.trigger('private-user-<%= @user.id %>', 'new-message', {
    message: 'You have a new alert!'
  })
  ```
**Troubleshooting**

- Error: "Subscription failed - 403 Forbidden"
  - This usually means the Pusher Private/Presence Channel authorization failed. Verify your Rails PusherController is correctly authenticating the user before granting channel access.
- Error: "Could not connect to WebSocket"
  - Verify the PUSHER_CLUSTER setting is correct in both the backend initializer and the frontend JavaScript client initialization.
  - Check firewall rules if deployed locally or behind a restrictive network.

---

### Google Authentication

**Purpose:** Provides a low-level library for handling Google's authorization and authentication flows (**OAuth 2.0 and Service Accounts**) in a Ruby environment. It is used to secure the required access tokens necessary for your Rails backend to interact with specific Google APIs (e.g., Google Sheets, Google Drive, or Calendar). This is essential for accessing data and generating reports or visualizations.

Sign up: https://console.cloud.google.com/

**Configuration (Backend)**

- **Add to** .env:
  ```
  GOOGLE_AUTH_TYPE=service_account # Or 'oauth'
  GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
  GOOGLE_SERVICE_ACCOUNT_KEYFILE=/path/to/key.json # Local path to the downloaded JSON key file
  # OR, for sensitive environments:
  # GOOGLE_SERVICE_ACCOUNT_KEY_JSON='{"type": "service_account", "project_id": "...", "private_key_id": "...", ...}'
  ```
 
- **Configuration in** config/initializers/google_auth.rb: 
  ```
  # config/initializers/google_auth.rb
  
  # Scopes define WHICH Google services this application is authorized to use
  GOOGLE_AUTH_SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets.readonly', # Example: Read-only access to Google Sheets
    'https://www.googleapis.com/auth/calendar'              # Example: Full Calendar access
  ].freeze
  ```

**Getting Credentials (Service Account Flow)**

- **Create a Project:** In the Google Cloud Console, create a new project.
- **Enable APIs:** Navigate to the "APIs & Services" > "Library" and enable the specific APIs you need (e.g., "Google Sheets API," "Google Calendar API").
- Create Service Account:
  - Navigate to "APIs & Services" > "Credentials".
  - Click "Create Credentials" and select "Service account".
  - Give it a name (e.g., rails-api-reporter).
  - Grant it the necessary role (e.g., Project > Viewer or a more restricted role).

- Generate Key:
  - Click on the new service account, navigate to "Keys", and click "Add Key" > "Create new key".
  - Select JSON format and download the file.

- **Secure Storage:** Place the downloaded JSON file in a secure, non-public directory on your server and update the GOOGLE_SERVICE_ACCOUNT_KEYFILE path in your .env.

**Usage Limits**

- **API Quotas:** Each Google API (Sheets, Maps, etc.) has its own specific usage quotas (requests per second/day).
- Free Tier: Google Cloud offers a Free Tier, but most specific API usage is covered by standard quotas or charged on a pay-as-you-go basis.

**Monitoring Usage**

Dashboard:https://console.cloud.google.com/home/dashboard

**Check:**
- API Usage: Use the APIs & Services dashboard to monitor current requests, error rates, and latency for each individual API (e.g., "Google Sheets API").
- Quotas: Check the Quotas section to see if you are approaching limits for a specific API.
- Billing: Monitor usage and costs in the Billing section.

**Alerts:** Set up Budget Alerts in the Billing section to notify you when monthly spending exceeds a certain threshold.

---
### Google Visualization (Charts)

**Purpose:** Embed interactive, high-performance data visualizations (e.g., Line Charts, Bar Charts) directly into the web interface for dashboards and reporting. This is utilized to display aggregated metrics like "Total Revenue," "Sends Per Nudge," and "New Patients" (inferred from dashboard_controller.rb).

**Sign up:** https://console.cloud.google.com/ (Requires a Google Cloud Project to manage quotas, though the library itself is public.)

**Configuration (Frontend)**

**Inclusion in** header:

The following scripts are already included in your HTML to load the visualization library:
```
<script type="text/javascript" src="https://www.google.com/jsapi"></script>
<script type="text/javascript">
  google.load('visualization', '1', {'packages':['corechart']});
</script>
```

**Data Structure (Backend Preparation):**

Data sent from the server must match the structure required by the Google Charts DataTable object. Your backend prepares this using a dedicated class, as seen in dashboard_controller.rb:

```
# Backend preparation (inferred from NudgeGraph class in dashboard_controller.rb)

# Example data structure expected by Google Visualization:
# column_names: [x_name, y1_name, y2_name]
# data: [[x1, y1(x1), y2(x1)], [x2, y1(x2), y2(x2)], ...]
```

**Getting Credentials**
- No API key is required solely to use the public Google Visualization library.
- If you need to fetch data from other secured Google services (like Sheets or BigQuery) to feed the charts, you would follow the Google Authentication steps (using a Service Account or OAuth) detailed previously.

**Usage Limits**
- The Google Visualization library itself has no direct cost or quota.
- API Quotas: If the application uses the charts to display data from other secured Google APIs (e.g., fetching a report from Google Drive), the usage will count against the quota of that specific API.

**Monitoring Usage**

Dashboard:https://console.cloud.google.com/home/dashboard
- API Usage: Monitor the usage of any underlying Google APIs (e.g., Google Drive API) used to generate the chart data.
- Browser Console: Use the browser's developer tools to check for errors during chart rendering (e.g., google.visualization is not defined usually means the jsapi loader failed).

---

### Google Maps Platform

**Purpose:** Embed interactive maps in the application, likely for visualizing client office locations, geographic distribution of patients, or overlaying performance data using the visualization library.

Sign up: https://console.cloud.google.com/

**Configuration (Frontend)**

**Inclusion in** header:

The Maps API is already included, specifying a key and the necessary visualization library:

```
<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBey9MKpn6dJsU5qJgg0NWorEThEDLmobo&libraries=visualization"></script>
```

**Key Configuration:**

```
# .env (or Rails credentials)
# This key is public in the HTML but should be restricted by referrer.
GOOGLE_MAPS_KEY=AIzaSyBey9MKpn6dJsU5qJgg0NWorEThEDLmobo
```
**Getting Credentials & Securing the Key**
- Google Cloud Console: Create a project and enable the Maps JavaScript API.
- Generate API Key: Create an API key in the APIs & Services > Credentials section.
- Security (CRITICAL): Since the key is exposed in the frontend HTML, it MUST be restricted:
   - Navigate to the API Key settings in the Console.
   - Set Application restrictions to HTTP referrers (web sites).
   - Add your production domain(s) (e.g., *.yourdomain.com/*). This prevents unauthorized use of your key and billing fraud.

- libraries=visualization: The inclusion of this library allows for advanced rendering of data layers, such as Heatmaps.

**Usage Limits**

- Billing Required: Google Maps Platform is a pay-as-you-go service. You must enable billing on your Google Cloud project.
- Monthly Free Tier: Includes a generous recurring monthly credit (e.g., $200 USD/month). Most usage for simple map displays often stays within this free limit.
- Pricing: Usage is metered per Map Load or per specific API call (e.g., Geocoding, Places Search).

**Monitoring Usage**

Dashboard:https://console.cloud.google.com/apis/dashboard

**Check:**
- Monitor usage metrics specifically for the Maps JavaScript API.
- Check the cost breakdown in the Billing section.

**Alerts:** Set up Budget Alerts to receive notifications if costs exceed your expected monthly threshold.

---

## Security Best Practices
### API Key Management
**DO:**

- Store keys in .env (never committed)
- Use separate keys for dev/staging/production
- Rotate keys periodically
- Use environment-specific keys


**DON'T:**

- Commit keys to repository
- Share keys via Slack/email
- Use production keys in development
- Hardcode keys in application code
- Access Control
- Limit API key permissions to minimum required
- Use IP whitelisting where available
- Enable MFA on service accounts
- Review access logs regularly

### Access Control
- Limit API key permissions to minimum required
- Use IP whitelisting where available
- Enable MFA on service accounts
- Review access logs regularly