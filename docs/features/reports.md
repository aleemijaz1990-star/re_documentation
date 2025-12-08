---
sidebar_position: 6
---

# Reports
Reports feature interface, which is structured into several tabs for different types of reporting and analytics. This feature is designed to allow users to generate, filter, and view key operational data regarding general reports, patient metrics, appointment summaries, and specific diagnosis/procedure codes (for certain clients).

## Reports Feature Documentation

The Reports feature acts as the business intelligence center of the application, providing detailed data views through five distinct tabs (some conditional).

### Core Functionality
- Filtering: Users can filter reports by Date Range (or All Time Data), Office, and Provider.
- Data Sync: A "Sync Data" button is available on some reports to refresh the underlying materialized views, ensuring the latest changes and modifications are included in the report data.
- Drill-Down: Many aggregate numbers are clickable (`<a>` with (click)="openModal(...)"), allowing users to drill down into a detailed list of the patients or appointments that make up that total.

## Report Tabs

### Reports (General Downloads)
This tab provides a list of pre-generated reports available for download.

| Data Displayed | Description |
| :--- | :--- |
| **Name** | The title of the report file (e.g., "Monthly Appointment Report"). |
| **Created** | The date the report file was generated on the server (`MM/dd/yyyy` format). |
| **Download Link** | A link to download the report file. **Note:** These links are only valid for **one hour** for security reasons. |

### Patient Stats
This tab provides a detailed summary of the patient database quality and health, filtered by date, office, and provider.

| Filter Option | Description |
| :--- | :--- |
| **All Time Data** | A checkbox toggle that, when selected, overrides the date range filters and includes all historical patient data in the statistics. |
| **Start Date / End Date** | Defines the specific time frame used to calculate the **Total New Patients** metric. |
| **Search by Office / Provider** | Allows users to filter the entire data set by a selected **Office** location or an assigned **Provider** (clinician). |
| **Minors Only** | (Client-specific feature, e.g., 'Tanner Clinic') Limits all displayed patient statistics and counts exclusively to patients below the age of majority. |

| Metric (Example) | Description & Drill-Down Action |
| :--- | :--- |
| **Total New Patients/Minors** | The total number of new patients added to the system within the selected filter period (or all-time, if selected). |
| **Patients Without Name** | The count of patient records missing required identification data (a first or last name). **Action:** Click the number to view a detailed list of these patients. |
| **Patients Without Text-Enabled Phone** | The count of patients who do not have a valid, SMS-capable phone number recorded. **Action:** Click the number to view the detailed list, which includes an **Edit** button to fix the missing phone number directly. |
| **Patients Who Opted Out** | The count of patients who have actively chosen to opt out of SMS communications. |
| **Patients Seen Annually** | Tracks patients who have had at least one appointment within the last 12 months, indicating active patient engagement. |


## Appointments Summary
This tab provides statistics on the outcome and confirmation status of appointments.

| Filter Option | Description |
| :--- | :--- |
| **All Time Data** | A checkbox toggle that, when selected, includes all historical appointment data in the summary, overriding any date range specified. |
| **Start Date / End Date** | Defines the specific time frame for which appointments are included and summarized in the report. |
| **Search by Office / Provider** | Filters the entire data set of appointments by a selected **Office** location or an assigned **Provider** (clinician). |

| Status Metric | Description |
| :--- | :--- |
| **Total** | The overall count of all appointment records within the selected date, office, and provider filters. |
| **Completed** | The count of appointments that were successfully attended and marked as finished. |
| **Rescheduled / Canceled** | The combined count of appointments that were officially rescheduled or canceled by the patient or provider. |
| **Confirmed / Not Confirmed** | The counts based on the patient's response status to appointment reminders (e.g., Confirmed means the patient verified their attendance). |

**Note on** Drill-Down: Clicking on any count (e.g., Completed or No Show) opens a modal that displays the detailed list of appointments corresponding to that status and name (appt.name).

## Patients Diagnosis Codes (Client-Specific)
- Availability: Only available for specific clients (e.g., 'Tanner Clinic').
- Filtering: Allows searching by one or more DX Codes (Diagnosis Codes).
- Output: Displays a detailed list of patients who have been associated with the selected DX Code(s).
- Export: Users can export the filtered patient list to a CSV file.

## Patients CPT Codes (Client-Specific)
- Availability: Only available for specific clients (e.g., 'Tanner Clinic').
- Filtering: Allows searching by one or more CPT Codes (Current Procedural Terminology Codes).
- Output: Displays a detailed list of patients associated with the selected CPT Code(s), including the CPT description.
- Export: Users can export the filtered patient list to a CSV file.

## Segment Gap Analysis Report (Client-Specific)
- Availability: Only available for specific clients (e.g., 'Tanner Clinic').
- Purpose: Used to measure compliance and engagement with specific patient segments (e.g., wellness programs, care gaps).
- Metrics: Tracks Total Patients, Compliant Patients (achieving segment goal), Eligible Patients (can be targeted), and Past Due Patients (missed segment goal).
- Lost Amount: Displays the estimated lost revenue associated with Past Due patients in the segment.
- Drill-Down: Compliant, Eligible, and Past Due counts are clickable to view the specific patients in that status.