---
sidebar_position: 4
---

# Texts
The Texts feature allows authorized users to manually send or schedule individual and bulk SMS messages to patients and clients. This module is separate from the automated Nudges system and is used for direct, manual communications.

## Access and Permissions

| Feature Area | Action | Purpose | Required Roles |
| :--- | :--- | :--- | :--- |
| **Viewing** | `index`, `show` | View logs of sent/scheduled messages; view details of a specific message. | Administrator, User, Engagement |
| **Management** | `new`, `create`, `bulk_create`, `update`, `destroy` | Create, schedule, modify, or delete text messages. | Administrator, User |

## Text Message Creation and Scheduling

The system supports two primary methods for sending messages: Single Text and Bulk Text. Both methods schedule the message using the TextService, which handles the actual transmission based on the defined schedule_at time.

### Single Text Creation (/texts/create)
This endpoint is used to schedule a text to a single recipient.
- Recipient Identification: The system attempts to associate the message with an existing patient (patient_id) or appointment (appointment_id).
- Phone Number Validation: If no associated ID is provided, the recipient's phone number (to_number) must be a valid phone number format.
- Required Fields: Message body, recipient phone number, associated office, provider, and schedule time (schedule_at).

### Bulk Text Creation (/texts/bulk_create)
This feature allows the same message to be sent to a list of multiple recipients simultaneously.
- The message, office, provider, and schedule time are consistent across all texts.
- Recipients are passed as a list of phone numbers in the params[:numbers] array.
- The system creates a separate Text record for each number in the list.

## Text Message Management (CRUD)

| Action | Endpoint | Description |
| :--- | :--- | :--- |
| **New** | `/texts/new` | Prepares the necessary data (active SMS-enabled offices and associated providers) to populate the message creation form. |
| **Update** | `/texts/update` | Allows modification of an existing scheduled text message, including changes to the message body and the `schedule_at` time. |
| **Destroy**| `/texts/destroy` | Deletes a scheduled text message record from the system **before** it is sent. |


## Viewing Text Logs
The system maintains a log of all text messages (sent and scheduled) for monitoring and auditing.
- Index (/texts/index): Displays a list of records including details like the message content, provider, office, and the recipient's name.
- Show (/texts/show): Retrieves the full content and status details for a specific text message using its ID.
