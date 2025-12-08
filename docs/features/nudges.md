---
sidebar_position: 2
---

# Nudges
The Nudges feature is a powerful tool for sending targeted, automated communications (messages) to patients or clients based on specific criteria. These communications are often scheduled around appointments, patient wellness criteria, or other key events.

## Nudge Management (CRUD Operations)
The system provides complete control over the lifecycle of a Nudge, from creation to deletion.

### Create a Nudge (/nudges/create)

Nudges are created by Administrators and require several key attributes and associations:

| Parameter | Description | Required Role |
| :--- | :--- | :--- |
| **`name`** | A unique, descriptive name for the Nudge. | Administrator |
| **`query_type_id`** | The ID of the predefined **Query Type** that determines which patients or clients will receive the Nudge (the target audience). | Administrator |
| **`channel_type`** | The method of communication (e.g., SMS, Email). | Administrator |
| **`active`** | Boolean flag to enable/disable the Nudge processing. | Administrator |
| **`revenue`** | (Optional) Associated revenue value for tracking purposes. | Administrator |
| **`start_date`, `end_date`** | Defines the period during which the Nudge should be active. | Administrator |
| **`description`** | A detailed explanation of the Nudge's purpose. | Administrator |
| **`offices`** | A comma-separated list of **Office IDs** where this Nudge should be active. | Administrator |
| **`attachment`** | (Optional) Allows an attachment (e.g., an image for an MMS message) to be uploaded to S3 and associated with the Nudge. | Administrator |


### Update a Nudge (/nudges/update)
Allows Administrators to modify any attribute of an existing Nudge. Updating the associated offices will result in all existing office associations being destroyed and replaced with the new list provided in the params[:offices].

### Delete a Nudge (/nudges/destroy)
Allows Administrators to permanently remove a Nudge from the system.

### Duplicate a Nudge (/nudges/duplicate)
Allows Administrators to quickly create a copy of an existing Nudge:
- The new Nudge is created with the name appended by " - Duplicate".
- All associated Touch Steps and Office Associations are copied to the new duplicate Nudge.

## Nudge Configuration & Data Retrieval

### Nudges Index (/nudges/index)
This endpoint retrieves all necessary data for the Nudge management screen. It is available to **Administrators, Users, and Engagement** roles.

It returns configuration data filtered by the authorized client and office data filters (get_data_filters):

- nudge_names: A list of all existing Nudge names and IDs for the client.
- offices: A list of active offices that have both SMS and SES (email) enabled, filtered by the user's data access.
- providers: A distinct list of provider names, sourced from associated offices and recent patient/appointment data (within the last 3 months).
- appt_list: A list of upcoming appointments (retrieve_appt_list) for context.

### Get Configuration (/nudges/get_config)
Available to Administrators, this endpoint retrieves system-wide configuration data necessary for setting up Nudges and campaigns:
- nudges: All Nudges for the client.
- campaigns: Active Campaigns that target 'Customer' or 'Prospect' pools using a specific selection strategy (selids).
- channels: Distinct communication types available (e.g., Email, Text) across the client's offices.
- query_types: Predefined query types that target specific patient segments.
- Offices: All active offices for the client.

## Previews, Logs, and Troubleshooting

### Nudge Preview (/nudges/nudge_preview)
Available to Administrators, Users, and Engagement roles. This is a critical debugging tool that simulates a Nudge run without actually sending messages.
- It executes the target_query defined by the Nudge's query_type.
- It performs Substitution: It takes the raw message content and replaces dynamic placeholders (like `{{fn}}` for first name, `{{ad}}` for appointment date) with actual patient data.
- It calculates the total_count (annual reach) for wellness-related nudges.
- Result: Renders a list of target patients and the final substituted message for each.

### Nudge Missing Fields (/nudges/nudge_missing_fields)
A tool for Administrators to identify patients who would be targeted by a Nudge but are missing required data fields needed for substitution.
- It analyzes the Nudge message template.
- It finds which required merge tags (e.g., first name, phone number) are missing data for the targeted patient pool.
- Result: Returns a list of patients grouped by the specific missing field (e.g., "5 patients are missing a phone number for the `{{phone_text}}` tag").

### Retrieve Send Log (/nudges/retrieve_send_log)
Available to **Administrators, Users, and Engagement** roles. This retrieves a log of messages that have been successfully processed and sent by the Nudge system.
- Filterable by: Date, Nudge Name, Office, and Provider.
- Data Fields: Includes message_id, sent_at, nudge name, office name, provider, message_type, and sent_to (patient/office name).

### Do Not Contact (/nudges/do_not_contact)
A simple utility for Administrators to mark a patient's email or phone number as opted-out of future communications.
- Creates a MessageOptOut record for the specified email (Type: 'Email') or phone (Type: 'Text').