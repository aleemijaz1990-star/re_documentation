---
sidebar_position: 5
---

# Leads
This module allows authorized users to track, manage, and engage with potential clients or patients before they are converted into official patient records.

## Access and Permissions
Access to the Leads module is controlled by user roles:

| Feature Area | Action | Purpose | Required Roles |
| :--- | :--- | :--- | :--- |
| **Viewing/Search** | `index`, `show`, `search` | View the list of leads or pull up details for a single lead. | Administrator, User, Engagement |
| **Data Management** | `create`, `update`, `destroy` | Create new leads, modify lead details, or permanently delete records. | Administrator, User |
| **Reassignment** | `reassign` | Change the assigned Provider or Office for a lead. | Administrator, User |

## Leads Data Management (CRUD)

### Viewing and Searching
- View List (index): Displays a list of all leads for the client, ordered primarily by last name and then first name.
- Search (search): Allows searching for leads using a general search_string.
- View Details (show): Fetches and displays the complete details for a single lead.

### Creating New Leads (create)
- Administrators and Users can create new lead records.
- Creation requires a valid office_id, a valid email address, and a valid phone_number.

### Deleting Leads (destroy)
Administrators and Users can permanently delete a lead record using its unique ID.

## Key Lead Functionality

### Lead Updates and Notification (update)
The update feature allows management of a lead's status and contact information.
- Notification: If a message is provided during the update, the system automatically sends a notification via email, likely to the assigned provider or office, alerting them to the changes or notes made on the lead record.

### Lead Reassignment (reassign)
- Administrators and Users can quickly change the Lead's ownership or location.
- Leads can be reassigned to a new provider_id or office_id.

## Updatable Lead Fields
The following fields can be managed via the update function:

| Field Group | Available Fields |
| :--- | :--- |
| **Identity** | `f_name` (First Name), `l_name` (Last Name) |
| **Contact** | `phone_number`, `email` |
| **Assignment** | `office_id`, `provider_id` |
| **Status/Source** | `lead_status_id`, `source_id`, `interest` |