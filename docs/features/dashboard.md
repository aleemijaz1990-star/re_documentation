---
sidebar_position: 1
---

# Dashboard

The Dashboard feature provides a personalized, at-a-glance view of key operational metrics for relevant application. It acts as a command center, dynamically pulling data related to patients, leads, appointments, and revenue based on your user-specific configuration

## Access and Personalization

### Roles and Access

Access to the data displayed on the dashboard is restricted to authenticated users with Administrator or User roles. The data displayed is typically scoped to the client (or office) you are currently authorized for.

### Custom Layout

The dashboard layout is personalized. The system remembers which widgets you have selected and their positions (priority and size) on the screen, allowing you to create a view tailored to your daily needs.

## Dashboard Widgets & Data

The dashboard is composed of various widgets (or cards), each fetching real-time data metrics. The following widgets are known to be supported by the system:

| Widget Name | Description | Data Focus |
| :--- | :--- | :--- |
| **Prospects** | Displays a historical, month-by-month view of prospective clients or patients. | Time Series (Monthly Count) |
| **Avg Appts Per Provider** | Shows the average number of appointments scheduled per healthcare provider (or equivalent staff member) over a specific period. | Performance Metric (Average) |
| **New Patients** | Tracks the count of new patients (or clients) added to the system over a monthly period. | Time Series (Monthly Count) |
| **Total Revenue** | Reports the overall revenue generated, tracked month-by-month. | Time Series (Monthly Sum) |
| **Sends Per Nudge** | Tracks the efficiency or frequency of automated communications (**Nudges**). | Engagement/Efficiency |
| **Appointment Reminder Summary** | Provides a quick overview of the status of automated appointment reminders (e.g., sent, delivered, confirmed, failed). | Summary (Counts) |


## Data Visualization Structure

The backend uses a specific structure (defined by the NudgeGraph class) to prepare data for graph visualizations, particularly for features like Nudges. This ensures that complex data can be easily rendered into visual charts.

### Graph Data Format

Each graph object organizes data with clear labels and coordinate values:

| Component | Description | Example Data |
| :--- | :--- | :--- |
| **`column_names`** | Defines the labels for the **x-axis** (first item) and all subsequent **y-axes**. | `[date, nudges_sent, revenue]` |
| **`data`** | The raw coordinate points. Each array must be the same length as `column_names`, with the **x-coordinate** as the first value, followed by the corresponding **y-coordinates**. | `[2019-01, 34, 3600]` (Interpreted as: Date: Jan 2019, 34 Nudges Sent, $3600 Revenue) |

This structure ensures graphs accurately display relationships between time or category (x-axis) and multiple tracked metrics (y-axes).