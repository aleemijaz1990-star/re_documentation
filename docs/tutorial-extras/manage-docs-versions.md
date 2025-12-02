---
sidebar_position: 1
---

# API Documentation

The Relevant MD API is a RESTful API built with Rails 7.1. It provides endpoints for managing nudges, offices, subscriptions, patients accounts, reports and marketing campaigns.

Base URL:

Production: https://relevantlocal.com/

## Dashboard API Documentation
The endpoints below are part of the Api::DashboardController and require user authorization via a client_id parameter.
### General Endpoints
**1.GET /api/dashboard (Index)**

Retrieves the current user's personalized dashboard layout and data. If a custom dashboard is not configured, a default one is created automatically.
- Authentication: Requires user to be an Administrator or User.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization to retrieve data for. |
- Success Response (200 OK):
    ```
    {
      "status": "success",
      "data": [
        // List of dashboard objects with chart data, size, type, etc.
        {"dashboard_id": 1, "name": "Prospects", "type": "sparkline", "data": [...]}
      ],
      "months": [ /* Array of month objects for time series */ ],
      "weeks": [ /* Array of week objects for time series */ ],
      "upcoming_weeks": [ /* Array of upcoming week objects */ ]
    }
    ```
- Error Response (401 Unauthorized):
    ```
     {
       "status": "error",
       "message": "You are not authorized to use the 'dashboard/index' endpoint."
     }   
    ```
**2.POST /api/dashboard (Create)**
Adds a new dashboard chart to the user's personalized view.
- Authentication: Requires user to be an Administrator or User.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | name | String | Yes | The name of the chart/dashboard to add (e.g., 'New Patients'). |
- Success Response (200 OK):
    ```
    {
      "status": "success",
      "data": {
        "person_id": 1,
        "dashboard_id": 10,
        "name": "New Chart Name",
        "dash_type": "graph",
        "size": 1
      }
    }
   ```
- Error Response (400 Bad Request):
    ```
    {
    "status": "error",
    "message": "This chart is already on your dashboard."
    }
    ```
**3.PATCH/PUT /api/dashboard/update_priority (Update Priority)**

Swaps the display priority of two charts on the user's dashboard.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | from_priority | Integer | Yes | The current priority of the chart to be moved. | | to_priority | Integer | Yes | The target priority to move the chart to. |
- Success Response (200 OK): Returns the full list of dashboards with the new priority order.

**4.DELETE /api/dashboard/destroy**

Removes a dashboard chart from the user's view and adjusts the priorities of other charts.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | id | Integer | Yes | The dashboard_id of the chart to remove. |
- Success Response (200 OK): Returns the data of the deleted chart association.
- Error Response (404 Not Found):
    ```
    {
      "status": "error",
      "message": "Could not find dashboard association."
    }
    ```
**5.GET /api/dashboard/dashboard_library (Dashboard Library)**

Retrieves a paginated list of all available dashboard charts for the user to select from, with client type determining which charts are included (e.g., 'Hearing' clients get extra charts).
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | page | Integer | Yes | The page number for pagination (used to determine the subset of charts to return). |
- Success Response (200 OK): Returns a list of available dashboard objects with current data.

**6.GET /api/dashboard/expand_dashboard (Expand Dashboard)**

Fetches expanded, detailed graph data and a summary table for a specific dashboard metric over a chosen date range.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | name | String | Yes | The internal name of the metric (e.g., new_patients, online_appointments, total_revenue). | | month_range | String/Integer | Yes | The time range for data (e.g., "6M", "1Y", "YTD", "ALL", "6W", "3M"). Range is internally converted based on metric type. |
- Success Response (200 OK):
    ```
    {
      "status": "success",
      "data": {
        "data": [ /* Time series data for graph */ ],
        "table": { /* Detailed table data in NudgeTable format */ }
      }
    }
    ```

---

### Nudge & Campaign Endpoints
**7.GET /api/dashboard/nudge_list (Nudge List)**

Returns a list of active nudges (campaigns/queries) grouped by recipient type and a list of offices with active nudges.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. |
- Success Response (200 OK):
    ```
    {
      "status": "success",
      "nt": [ // Nudge Types/Recipient Types
        {"recipient_type": "Appointment", "nudge_list": [...]},
        {"recipient_type": "Patient", "nudge_list": [...]}
      ],
      "fcs": [ // Office/Facility List
        {"office_id": 1, "name": "Office A"}
      ]
    }
    ```

**8.GET /api/dashboard/dash_nudge_data (Dashboard Nudge Data)**
   
Retrieves performance data for a specific type of nudge, identified by its query type nickname.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | qt_nickname | String | Yes | The nickname of the Query Type (e.g., aprm, ns, upg). | | month_range | String/Integer | No | Date range to filter data (e.g., "6M", "1Y", "YTD", "ALL", or custom range start__end). |
- Success Response (200 OK):
    ```
    {
      "status": "success",
      "data": {
        "tables": [ /* Array of table data */ ],
        "graphs": [ /* Array of graph data */ ],
        "query_type": "qt_nickname"
      },
      "nudges": [ /* List of individual nudges for this query type */ ]
    }
    ```
**9.GET /api/dashboard/single_nudge_data (Single Nudge Data)**

Retrieves detailed performance metrics for one specific nudge instance, including A/B test information if applicable.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | nudge | JSON String | Yes | JSON object specifying the nudge (e.g., `{"id": 123, "query_type": "aprm"}`). |
- Success Response (200 OK):
    ```
    {
      "status": "success",
      "data": {
        "tables": [ /* Table data */ ],
        "graphs": [ /* Graph data */ ],
        "ts_graph": { /* Touch step graph data (e.g., for opt-outs) */ },
        "query_type": "aprm",
        "ab_test": false,
        "ab_table": [ /* A/B test table data */ ],
        "ab_data": [ /* A/B test time series data */ ]
      }
    }
    ```
**10.GET /api/dashboard/touch_step_summary (Touch Step Summary)**
    
Retrieves time series data for a specific metric (category) within a nudge's touch step.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | nid | JSON String | Yes | JSON object or ID of the Nudge. | | category | String | Yes | The metric category to summarize (e.g., opt_outs). | | date_range | String/Integer | Yes | The time range for data (e.g., "6M", "ALL"). |
- Success Response (200 OK): Returns time series data for the requested metric.

**11.POST/PUT/PATCH /api/dashboard/update_datetime (Update Datetime)**
    
Updates or retrieves new time series data for a selected metric column and date range, based on a nudge or query type.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | date_range | String/Integer | Yes | Time range for data (e.g., "6M", "1Y", "YTD", "ALL", or custom range start__end). | | column_selected | String | Yes | The metric column name to query (e.g., completed_appts, total_revenue). | | nickname | String | Yes | Query Type nickname (e.g., aprm). | | fc_ids | String | No | Comma-separated list of Facility/Office IDs for filtering. | | nudge | JSON String | No | JSON object specifying a single nudge instance. |
- Success Response (200 OK): Returns an array of time series data points.
- Error Response (500 Server Error): Throws an ArgumentError if the client's ar_cond_completed_appt preference is missing.

**12.POST/PUT/PATCH /api/dashboard/update_ab_datetime (Update A/B Datetime)**
    
Retrieves time series data for a specific A/B test touch step.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | ts_id | Integer | Yes | The ID of the A/B test touch step. | | month_range | String | No | Date range to filter data (e.g., "6M", "1Y", "YTD", "ALL"). |
- Success Response (200 OK): Returns A/B test time series data.

**13.GET /api/dashboard/summary_totals (Summary Totals)**
    
Retrieves a holistic summary of nudge performance including revenue, close rate sparklines, and detailed table data.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | date | Integer | No | The year to retrieve data for (defaults to current year). |
- Success Response (200 OK):
    ```
    {
      "status": "success",
      "data": {
        "dashboard": { /* Summary sparkline data */ },
        "table": { /* Nudge summary table */ },
        "nudge_summary": { /* Revenue summary by nudge */ },
        "graphs": [ /* Array of graphs (e.g., sends, opt-outs) */ ]
      }
    }
    ```

---

### Prospect & Channel Endpoints

**14.GET /api/dashboard/channel_call_summary (Channel Call Summary)**
    
Retrieves a summary of prospect call data grouped by channel.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. |
- Success Response (200 OK): Returns channel summary data.

**15.GET /api/dashboard/prospect_calls_trend (Prospect Calls Trend)**
    
Retrieves prospect call trend data, with optional filtering by month and office.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | month | Integer | No | Month filter (e.g., 1 for January). | | office_id | Integer | No | Office ID filter. |
- Success Response (200 OK): Returns prospect call trend data.

**16.GET /api/dashboard/prospect_calls_12mo (Prospect Calls 12 Months)**
    
Retrieves 12 months of prospect call trend data.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. |
- Success Response (200 OK): Returns 12-month prospect trend data.

---

### Survey Endpoints
**17.GET /api/dashboard/survey_list (Survey List)**
    
Retrieves a list of all active survey names for the client.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. |
- Success Response (200 OK): Returns an array of survey names.

**18.GET /api/dashboard/survey_data (Survey Data)**
   
 Retrieves detailed results for a specific survey, including question-by-question metrics, average score, response counts (1-5), and total surveys taken/sent.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | survey | String | Yes | The name of the survey (e.g., 'Completed Appointment Survey'). |
- Success Response (200 OK):
    ```
    {
      "status": "success",
      "data": [
        // Array of survey questions with data like avg, graph_data, and responses
      ],
      "surveys_taken": 120, // Total unique respondents
      "surveys_sent": 500   // Total survey messages sent
    }
    ```

## Nudge API Documentation (Api::NudgeController)
The Api::NudgeController manages the configuration, retrieval, and status handling (opt-out/opt-in, bad entries) for individual Nudge campaigns. All endpoints are JSend-compliant and require user authorization via a client_id parameter.

### Configuration and Listing Endpoints

**1.GET /api/nudges (Index)**

Retrieves filter data used for configuring and listing Nudges, based on the authorized user's permissions.
- Authentication: Requires user to be an Administrator, User, or Engagement.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. |
- Success Response (200 OK):
  ```
  {
    "status": "success",
    "data": {
      "nudge_names": [
        {"id": 1, "name": "Appointment Reminder"},
        // ... more nudge name objects
      ],
      "offices": [
        // List of active Office objects (id, name) with SMS/Email enabled
      ],
      "providers": [
        "Dr. John Smith",
        // ... more full name strings of providers
      ]
    }
  }
  ```
**2.GET /api/nudge/data_structures (Data Structures)**
   
Fetches detailed structural information for a specific Nudge instance, including query details, recipient types, intervals, and required fields.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | id | Integer | Yes | The ID of the Nudge object. |
- Success Response (200 OK):  
  ```
  {
    "status": "success",
    "data": {
      "nudge_query": { /* Query details */ },
      "recipient_type_details": { /* Recipient info */ },
      "nudge_intervals": [ /* Interval data */ ],
      "required_fields": [ /* Array of required fields */ ]
    }
  }
  ```
**3.POST /api/nudge/ab_test_builder (A/B Test Builder)**
   
Used to set up an A/B test by retrieving touch step data (e.g., messages and send logic) for a Nudge with A/B testing enabled.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | id | Integer | Yes | The ID of the Nudge object. | | type | String | Yes | The communication type (e.g., email, sms, both). |
- Success Response (200 OK):
  ```
  {
    "status": "success",
    "data": {
      "touch_steps": [ /* Array of touch step objects */ ],
      "sends_per_step": { /* Sends-per-step configuration */ }
    }
  }
  ```
---
### Update and Action Endpoints

**4.POST /api/nudge/ab_test_database_update (A/B Database Update)**
   
Updates a single field in the A/B test configuration for a specific touch step.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | id | Integer | Yes | The ID of the Nudge object. | | database_step_id | String | Yes | The DB ID for the specific touch step. | | area_name | String | Yes | The name of the A/B test area (area1, area2, etc.). | | field_name | String | Yes | The name of the field to update. | | field_value | String | Yes | The value to set for the field. |
- Success Response (200 OK): Returns the full updated A/B test data object.
- Error Response (402 Payment Required): Thrown on a DB write exception.

**5.POST /api/nudge/update (Update)**
   
Updates the main Nudge object, including its settings, campaign details, and linked touch steps. Changes are recorded in a log.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | id | Integer | Yes | The ID of the Nudge object. | | data | JSON String | Yes | The Base64-encoded touch_steps configuration data. | | field_name | String | Yes | The name of the field on the Nudge object to update. | | field_value | String | Yes | The value to set for the field. | | brief_summary | String | No | A summary of the changes made (for logging). |
- Success Response (200 OK): Returns the full updated Nudge object as JSON.

**6.DELETE /api/nudge/delete_bad_entry (Delete Bad Entry)**
Deletes a specific "bad data" entry associated with a Nudge.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | id | Integer | Yes | The ID of the Nudge object. | | bad_entry_id | Integer | Yes | The record ID of the bad entry to delete. | | bad_entry_date | String | Yes | The date of the bad entry (as a string). | | touch_step_name | String | Yes | The name of the Touch Step the bad entry came from. |
- Success Response (200 OK):
  
  ```
  {
    "status": "success",
    "message": "Bad entry successfully deleted."
  }
  ```
- Error Response (404 Not Found): Thrown if the record ID is not found.

---
### Patient Interaction and Status Endpoints

**7.POST /api/nudge/opt_out_confirmation (Opt Out Confirmation)**
   
Processes and confirms a request to opt a patient out of a specific Nudge.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | id | Integer | Yes | The ID of the Nudge object. | | patient_id | String | Yes | The patient's ID. | | qt_nickname | String | Yes | The nickname of the Query Type (e.g., aprm). | | recipient_id | Integer | Yes | The ID of the recipient who opted out. | | recipient_type | String | Yes | The type of the recipient (e.g., Patient). |
- Success Response (200 OK):
  ```
  {
    "status": "success",
    "message": "Patient opt-out confirmed."
  }
  ```
**8.POST /api/nudge/opt_in_confirmation (Opt In Confirmation)**

Processes and confirms a request to opt a patient back into a specific Nudge.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | id | Integer | Yes | The ID of the Nudge object. | | patient_id | String | Yes | The patient's ID. | | qt_nickname | String | Yes | The nickname of the Query Type (e.g., aprm). | | recipient_id | Integer | Yes | The ID of the recipient who opted in. | | recipient_type | String | Yes | The type of the recipient (e.g., Patient). |
- Success Response (200 OK):
  ```
  {
    "status": "success",
    "message": "Patient opt-in confirmed."
  }
  ```

**9.GET /api/nudge/get_missing_data (Get Missing Data)**
  
Retrieves a list of patients who are missing required fields for a specific Nudge and Touch Step, grouping them by the missing field/tag.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | id | Integer | Yes | The ID of the Nudge object. | | touch_step_id | String | Yes | The DB ID for the specific touch step. |
- Success Response (200 OK): 
  ```
  {
    "status": "success",
    "patients": {
      "tag_name_1": [
        // Array of patient objects missing this field
      ],
      "tag_name_2": [
        // Array of patient objects missing this field
      ]
    },
    "nudge": { /* Nudge details */ },
    "touch_step": { /* Touch step details */ }
  }
  ```
- Error Response (404 Not Found): Thrown if the Nudge or authorized client is not found  

## Patient API Documentation (Api::PatientController)
The Api::PatientController is responsible for managing patient-related data and actions, primarily focusing on consent status, contact information, family relationships, and setting a primary representative. All endpoints require user authorization via a client_id parameter and adhere to JSend-compliant standards.

### Patient Status and Listing Endpoints
**1.GET /api/patients (Index)**
   
Retrieves a list of offices with active communication channels (sms_enabled: true) that the authorized user can access. This endpoint prepares the data for a larger patient listing view, though the actual patient list retrieval (GetPatients) appears commented out in the provided code.
- Authentication: Requires user to be an Administrator, User, or Engagement.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. |
- Success Response (200 OK):
  ```
  {
    "status": "success",
    "data": {
      "fcs": [
        {"id": 1, "name": "Office A"},
        {"id": 2, "name": "Office B"}
        // ... list of active facilities/offices
      ]
      // Patient data (`patients`) is currently commented out in the controller
    }
  }
  ```
- Error Response (401 Unauthorized):  
  ```
  {
    "status": "error",
    "message": "You are not authorized to use the 'patients/index' endpoint."
  }
  ```
**2.POST /api/patients/mark_as_consented (Mark as Consented)**

Updates a patient's consent status to true for a specific communication channel (e.g., texts, emails).
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | pid | Integer/String | Yes | The unique ID of the patient. | | location | String | Yes | Specifies the channel being updated (texts, emails). | | source_id | Integer | No | Used for finding the patient if location is not "texts". |
- Success Response (200 OK):  
  
  ```
  {
    "status": "success",
    "message": "Patient communication preferences successfully updated."
  }
  ```
- Error Response (400 Bad Request): Thrown if the patient is not found or the location is unknown.

---

### Contact and Relationship Endpoints

**3.GET /api/patients/family_tree (Family Tree)**

Retrieves the family relationship network for a patient, listing all associated individuals.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | patient_id | Integer | Yes | The ID of the patient to search for. |
- Success Response (200 OK): Returns a list of related people and their relationship details.

**4.POST /api/patients/family_tree_search (Family Tree Search)**
  
Searches for existing patient records that match a given contact number, used for adding individuals to a family tree.
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | phone | String | Yes | The phone number to search for (numeric string). |
- Success Response (200 OK): Returns a list of matching patients.

**5. POST /api/patients/set_representative (Set Representative)**
   
Sets a patient with a specific source_id and phone as the primary legal representative (rel_priority: 5) among all patients sharing that phone number. Other patients sharing the number who were previously the representative are downgraded (rel_priority: 4).
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | phone | String | Yes | The phone number used to identify related patients. | | source_id | Integer | Yes | The unique ID from the source system for the patient to be set as the representative. |
- Success Response (200 OK):
  ```
  {
    "status": "success",
    "message": "Representative successfully set."
  }
  ```
- Error Response (404 Not Found):

  ```
  {
    "status": "error",
    "message": "No patient found with the given source_id and phone"
  }
  ```
- Asynchronous Action: This endpoint triggers an asynchronous refresh of the mv_patient_phone_name materialized view to ensure data consistency after updating the representative.


## Billing API Documentation (Api::BillingController)
The Api::BillingController is primarily used by a System Administrator to retrieve high-level billing and usage data across all clients, including active office counts, provider counts, and phone billing totals.

### Reporting Endpoints (System Administrator Only)
**1.GET /api/billing (Index)**
   
Retrieves a list of clients and the count of their active offices. It filters clients to include only those with specific client types ('Hearing') or nicknames ('ssm') and excludes a few specific client names ('OneRetail', 'Optimal Hearing', 'Sonus Hearing').
- Authentication: Requires user to be a "System Administrator".
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization (used for authorization check). |
- Success Response (200 OK):
  ```
  {
    "status": "success",
    "data": [
      {"client": "Client A", "active_offices": 15},
      {"client": "Client B", "active_offices": 8}
      // ... more client records
    ]
  }
  ```
- Error Response (401 Unauthorized):
  ```
  {
    "status": "error",
    "message": "You are not authorized to use the 'billing/index' endpoint."
  }
  ```
**2.GET /api/billing/provider_count**

Retrieves the total count of distinct healthcare providers across all clients that have sent messages through the system.
- Authentication: Requires user to be a "System Administrator".
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization (used for authorization check). |
- Success Response (200 OK):  
  ```
  {
    "status": "success",
    "data": [
      {"client": "Client A", "provider_count": 5, "client_id": 101},
      {"client": "Client B", "provider_count": 12, "client_id": 102}
      // ... more client records
    ]
  }
  ```

**3.GET /api/billing/billing_totals (Phone Billing Totals)**
   
Retrieves the total count of messages sent/received for all clients that have used the phone billing system. This data is truncated to the current month by default.
- Authentication: Requires user to be a "System Administrator".
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization (used for authorization check). |
- Success Response (200 OK):  
  ```
  {
    "status": "success",
    "data": [
      {
        "client_id": 101,
        "client_name": "Client A",
        "total_sends": 540,
        "total_receives": 120
      }
      // ... more client records
    ]
  }
  ```
- Error Response (401 Unauthorized):
  ```
  {
    "status": "error",
    "message": "You are not authorized to use the 'phones/billing_totals' endpoint."
  }
  ```

## Campaign API Documentation
This documentation covers two controllers: Api::CampaignController (for managing campaigns themselves) and Api::CampaignTypeController (for managing the categories/types of campaigns). All endpoints require authorization and adhere to JSend-compliant standards.

### Campaign Management (Api::CampaignController)
This controller handles the creation, listing, updating, and logical deletion (deactivation) of specific campaigns.
**1.GET /api/campaigns (Index)**
   
Retrieves a comprehensive list of all active and inactive campaigns for a client, along with all associated lookup tables necessary for creating and updating a campaign.
- Authentication: Requires user to be an "Administrator".
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. |
- Success Response (200 OK): Returns an object containing the main list of campaigns and all reference data.
  ```
  {
    "status": "success",
    "data": {
      "campaigns": [ /* List of Campaign objects with associations */ ],
      "campaign_types": [ /* List of active CampaignType objects */ ],
      "offer_types": [ /* List of active OfferType objects */ ],
      "media_types": [ /* List of all MediaType objects */ ],
      "media_packages": [ /* List of MediaPackage objects with tags */ ],
      "selection_strategies": [ /* List of SelectionStrategy objects */ ],
      "pools": [ /* List of Pool objects */ ]
    }
  }
  ```

**2.POST /api/campaigns/create (Create)**
   
Creates a new campaign record for the client.
- Authentication: Requires user to be an "Administrator".
- Parameters: Accepts all fields for the Campaign object, including: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | name, description, active, campaign_type_id, media_type_id, selection_strategy_id, pool_id, media_package_id, etc. | Varies | Yes/No | Campaign attributes. | | offer_types | String | No | Comma-separated list of OfferType IDs to associate with the campaign. |
- Success Response (200 OK): Returns the newly created Campaign object.
- Error Responses (401/error): Thrown on authorization failure or if required fields/associations are invalid.

**3.POST /api/campaigns/update (Update)**
   
Updates an existing campaign, including its basic attributes and its associated offer types.
- Authentication: Requires user to be an "Administrator".
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | id | Integer | Yes | The ID of the campaign to update. | | offer_types | String | No | Comma-separated list of OfferType IDs. Existing associations are destroyed and replaced. | | name, description, etc. | Varies | No | Any other updatable Campaign attributes. |
- Success Response (200 OK): Returns the updated Campaign object.
- Error Responses (401/error): Thrown on authorization failure or invalid data/associations.

**4.DELETE /api/campaigns/destroy (Destroy)**
Marks a campaign as inactive. If the campaign has no dependent records, it is physically destroyed; otherwise, it is only deactivated (active: false).
- Authentication: Requires user to be an "Administrator".
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | id | Integer | Yes | The ID of the campaign to deactivate/destroy. |
- Success Response (200 OK): Returns the object of the campaign that was destroyed/deactivated.

---

## Campaign Type Management (Api::CampaignTypeController ()
This controller handles the CRUD (Create, Read, Update, Destroy) operations for CampaignType records, which serve as categories for campaigns.

**1.GET /api/campaign_types (Index)**

Retrieves a list of all active and inactive campaign types for the client.
- Authentication: Requires user to be an "Administrator".
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. |
- Success Response (200 OK): Returns an array of CampaignType objects, ordered by active status descending and then by name.

**2.POST /api/campaign_types/create (Create)**
   
Creates a new campaign type.
- Authentication: Requires user to be an "Administrator".
- Parameters: Accepts fields for the CampaignType object: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | name | String | Yes | The name of the new campaign type. | | active | Boolean | No | The initial active status (defaults to true). |
- Success Response (200 OK): Returns the newly created CampaignType object.

**3.POST /api/campaign_types/update (Update)**
   
Updates an existing campaign type.
- Authentication: Requires user to be an "Administrator".
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | id | Integer | Yes | The ID of the campaign type to update. | | name | String | No | The new name for the campaign type. | | active | Boolean | No | The new active status. |
- Success Response (200 OK): Returns the updated CampaignType object.

**4.DELETE /api/campaign_types/destroy (Destroy)**
   
Marks a campaign type as inactive. If the campaign type is not associated with any active campaigns, it is physically destroyed.
- Authentication: Requires user to be an "Administrator".
- Parameters: | Parameter | Type | Required | Description | | :--- | :--- | :--- | :--- | | client_id | Integer | Yes | The ID of the client/organization. | | id | Integer | Yes | The ID of the campaign type to deactivate/destroy. |
- Success Response (200 OK): Returns the object of the campaign type that was destroyed/deactivated.


----
## HTTP Status Codes
- 200 OK - Successful request
- 201 Created - Resource created successfully
- 204 No Content - Successful request with no response body
- 400 Bad Request - Invalid request format
- 401 Unauthorized - Missing or invalid authentication
- 403 Forbidden - Authenticated but not authorized
- 404 Not Found - Resource not found
- 422 Unprocessable Entity - Validation failed
- 429 Too Many Requests - Rate limit exceeded
- 500 Internal Server Error - Server error
