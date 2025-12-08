---
sidebar_position: 3
---

# Patients

This document outlines the features and functionality of the Patients management module, which allows authorized users to view, manage, and maintain the records of individuals associated with the client

## Access and Permissions

Access to the Patient module is restricted to authorized users. Different actions require different levels of permission:

| Feature | Action | Required Roles |
| :--- | :--- | :--- |
| **View/Search Patient List** | `index`, `show`, `search` | Administrator, User, Engagement |
| **Create New Patient** | `create` | Administrator |
| **Delete Patient** | `destroy` | Administrator |
| **Update Opt-In Status** | `update` (Opt-in/out) | Administrator, User |
| **Update Patient Details** | `update` (Name, Address, Email, etc.) | Administrator |

## Patient Data Management

### Viewing and Searching
- View List (index): Displays a comprehensive list of all patient records.
- Search (search): Allows users to search for patients using a general search string (search_string).
- View Details (show): Fetches and displays the complete details for a single patient record.

### Creating New Patients (create)
Only **Administrators** can manually create a new patient record.

The system allows input for core identity and contact fields. If a phone number is provided during creation, the system automatically defaults the SMS Opt-Out status to false (opted-in).

### Deleting Patients (destroy)
Administrators can permanently delete a patient record using its unique ID.

### Updatable Patient Fields
The following fields can be managed via the update function:

| Field Group | Available Fields |
| :--- | :--- |
| **Identity** | `f_name` (First Name), `l_name` (Last Name) |
| **Contact** | `email`, `phone_text`, `phone_call` |
| **Address** | `street1`, `street2`, `city`, `state`, `zip4` |
| **Other** | `dob` (Date of Birth) |

### Opt-In/Opt-Out Management
The update feature allows authorized users to specifically manage a patient's opt-out status for SMS communications.

| Status Update | Description | Required Roles |
| :--- | :--- | :--- |
| **Opt-In/Out** | Updates the patient's `sms_opt_out` status. This action is handled separately from updating other general patient details (like name or address). | Administrator, User |