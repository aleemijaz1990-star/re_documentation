---
sidebar_position: 1
---

# Relevant Workflow Automation
This documentation covers the core components of Relevant Workflow Automation system, focusing on the background processes responsible for integrating data and executing automated patient engagement (Nudges and Touches).
these workflows indicate a system designed for a specific client, denoted as bcb (likely a concrete company or client ID), emphasizing real-time data integration and automated marketing.


## Relevant Workflow Automation (Background Processes)
The automation system runs as a series of background jobs (likely workers or cron jobs) responsible for two major, distinct tasks: data synchronization (importing customer/order data) and patient engagement (processing nudges and touches).

### Data Import and Synchronization
(bcb_realtime_concrete_import_customers_orders.rb)

This process is critical for maintaining up-to-date customer, order, and appointment data within the application. It acts as an integration layer, pulling data from an external source (identified as a SOAP Concrete API) into the application's internal database structure.

#### Process Overview
- **Initialization:** The script connects to the internal Relevant database (rwsdb_dev or production equivalent) and identifies the client (@app_id = 'bcb').
- **API Connection:** It attempts to log into the external SOAP Concrete API. If the login fails, the process is aborted and an error is logged.
- **Data Retrieval & Transformation:** Once connected, the script retrieves external data and performs complex SQL operations (using temporary tables) to transform and insert this data into the application's core tables: patients, appointments, and products.
- **Error Handling:** Robust error logging is implemented to capture and timestamp issues related to the database, AWS services (SES), and general execution failures.

#### Core Data Synchronization Actions
The script manages the following data entities during synchronization:

| Entity | Action | Notes |
| :--- | :--- | :--- |
| **Appointments** | Inserted/Updated | New appointments are logged. A key step involves linking appointments to **Touch Steps** and marking related records as `removed = true` in the temporary tables if an appointment is found to be canceled or removed in the external system. |
| **Products** | Inserted/Updated | Tracks customer product purchases or orders, ensuring the application has the latest transaction history. |
| **Leads/Patients** | Updated | The system updates existing patient records with the newest data imported from the external source, ensuring the data reflects the most current information (e.g., name changes, address updates). |


#### Temporary Data Management
The process uses temporary SQL tables for efficient bulk operations, which are dropped immediately after the synchronization run is complete:
- tmp_appointments_#`{client_id}`_...
- tmp_products_#`{client_id}`_...

### Patient Engagement Processing 
(bcb_realtime_process_nudges_and_touches.rb)

This process is the execution engine for the automated patient communications configured via the Nudges module. It runs defined queries, generates messages, and executes the required messaging actions (SMS, Email, etc.).

#### Nudge Query Execution
The core task is to identify the target audience for each active Nudge using specific SQL queries.
- bcb_get_query function: This helper generates the dynamic SQL required to find the list of patient_ids, contact details, and associated office information for a given Nudge.
- Example Query (aschh): A specific query type named aschh is defined. This query involves looking at aggregated purchases linked to appointments to build a targeted list, demonstrating sophisticated targeting capabilities.

#### Touch Step and Touch Generation
Once a target audience is identified by a Nudge query, the script iterates through the associated Touch Steps to generate and execute the communication.

| Component | Description |
| :--- | :--- |
| **Touch Generation** | Creates `Touch` records in the database for each intended communication (whether it is an SMS, Email, or Print mailer). This logs the intent to send the message. |
| **Message Substitution** | Executes dynamic substitution logic (`NudgeShared.substitute_message`) to replace personalized text placeholders (e.g., `{{fn}}` for first name, `{{ap}}` for appointment time) with actual, relevant patient and appointment data. |
| **Touch Execution** | Calls the relevant external service (`TouchService.call_api`) to queue the message for actual sending via the chosen communication channel (e.g., SMS provider or email service). |




#### Media Buys (Cost Tracking)
For certain touch types (like Direct Mail or expensive SMS/MMS), the system tracks the associated marketing spend using the media_buys table:
- **Media Buy Creation:** A MediaBuy record is created for a Touch Step if it is configured to trigger a physical mailer or other tracked spend.
- **Recipient Tracking:** Recipients of the Media Buy are logged in the media_buys_recipients table, allowing for accurate cost-per-recipient and campaign ROI analysis.

### Message Failures
The process tracks communication failures:
- **Failure Logging:** If a message fails (e.g., due to an invalid phone number or email), a TouchFailure record is created.
- **Opt-Out Check:** Before sending, the script verifies if the patient has an active MessageOptOut record to ensure compliance. Messages are not sent if a patient has previously opted out.

---

## Relevant Workflow Automation (MHC Client)

(mhc_realtime_process_nudges_and_touches.rb and mhc_realtime_refresh_sycle_appt_data.rb)  files introduce a workflow automation system for a different client, identified as mhc, and reveal an integration with a specific third-party EMR/Scheduling system called Sycle.

This documentation outlines the automated processes for the mhc client, highlighting the unique data synchronization mechanism and the specialized Nudge queries.

### Data Refresh and Synchronization 
(mhc_realtime_refresh_sycle_appt_data.rb)

This process is dedicated to ensuring that appointment data from the Sycle scheduling system is current. Unlike the previous client (bcb) which used a direct SOAP API connection, mhc uses an Asynchronous Queueing system via Amazon SQS.

| Component | Description |
| :--- | :--- |
| **Data Source** | **Sycle** (A specialized third-party EMR/Scheduling system). |
| **Mechanism** | Asynchronous Queue (AWS SQS) . This decouples the refresh request from the actual data processing job. |
| **Process Flow** | 1. The script securely packages client parameters (`nn`, `pt`, `db`, `un`, `pw`) and a unique key (`ky`). 2. It sends this data as a message to the `rfl-automation.fifo` SQS queue, tagged with the `SycleApptRefresh:In` group ID. 3. The local process then **waits** for a response on the same queue, looking specifically for the `SycleApptRefresh:Out` message group ID, which signals the completion of the external data refresh. |
| **Goal** | To trigger a background job on an external system to fetch and synchronize the latest Sycle appointment data (e.g., `sycle_1386_ahcoa`) into the application's database. |

### Patient Engagement Processing 
(mhc_realtime_process_nudges_and_touches.rb)

This process executes the automated Nudges and Touches for the mhc client, with specialized logic for appointment reminders.

#### Core Nudge Query: Appointment Reminders (aprmh)
The system defines specialized SQL queries for finding the right patients at the right time.

| Nudge Query Name | Description | Targeting Logic |
| :--- | :--- | :--- |
| **`aprmh`** | Appointment Reminders (for `mhc` client). | **Time-Boxed:** Targets appointments that fall within a 1-hour time slot. The offset (`ofs`) parameter defines how many hours *before* the appointment time the message is processed. For example, `ofs=0` targets appointments starting in the next hour. |
| **Status Filters** | Only includes appointments that currently have a status of `'Not Confirmed'` or `'Confirmed'`, excluding any that have been canceled or completed. |
| **Exclusions** | Explicitly excludes appointments with specific names, such as `'Follow up Phone Consultation'` and `'In Trial Call Back'`, to prevent unnecessary or irrelevant messaging. |
| **Time Zone** | Accurately calculates the processing window by using the `utc_offset` of the patient's office to convert the UTC appointment time to the local time zone. |

#### Touch Execution and Media Tracking
Similar to the previous client's workflow, this script handles message generation, personalization, and tracking:

| Component | Description |
| :--- | :--- |
| **Touch Generation** | Creates `Touch` records in the database for each intended communication (SMS, Email, or Print). This record logs the intent to send the message to a specific patient. |
| **Message Substitution** | Executes dynamic substitution logic (`NudgeShared.substitute_message`) to personalize the content by replacing placeholders (e.g., `{{fn}}` for first name) with actual patient and appointment data. |
| **Touch Execution** | Calls the relevant external service (`TouchService.call_api`) to queue or send the message, including a critical check to ensure the patient has **not** opted out before execution. |
| **Media Buys Tracking** | If a **Touch Step** is configured for tracked marketing spend (e.g., Direct Mail or a high-cost MMS), a `MediaBuy` record is created to track the cost, fulfillment details, and recipient list (`media_buys_recipients`) for ROI analysis. |

---
## Relevant Workflow Automation (SSM Client)

The ssm client utilizes the same architecture as the mhc client, integrating with the Sycle scheduling system via an asynchronous queue and running a specialized Nudge processing engine.

### Data Refresh and Synchronization (ssm_realtime_refresh_sycle_appt_data.rb)
This process is dedicated to initiating the synchronization of appointment data from the Sycle scheduling system. It operates asynchronously using AWS SQS.

| Component | Description |
| :--- | :--- |
| **Data Source** | **Sycle** (Third-party EMR/Scheduling system). |
| **Mechanism** | Asynchronous Queue (AWS SQS). The job posts a request to the queue and waits for an external worker to handle the heavy processing. |
| **Process Flow** | 1. The script generates a unique key and client parameters (`nn="ssm"`, `db="sycle_3347_ssm"`, etc.). 2. It sends a message to the SQS queue with the **`SycleApptRefresh:In`** group ID. 3. The process then **waits** in a loop, consuming messages and looking for a corresponding acknowledgment with the **`SycleApptRefresh:Out`** group ID, signaling that the external data processor has successfully finished the refresh. |
| **Goal** | To trigger the backend worker (`process_sycle_appt_refresh_queue.rb`) to fetch and synchronize the latest Sycle appointment data for the `ssm` client into the application database. |

### Patient Engagement Processing 
(ssm_realtime_process_nudges_and_touches.rb)

This process is the execution engine for the automated patient communications (Nudges and Touches) configured for the ssm client.

#### Core Nudge Query: Appointment Reminders (aprmh)
The ssm client uses a query that is very similar to the mhc client's appointment reminder logic, but with a specific client-level exclusion.

| Nudge Query Name | Description | Targeting Logic |
| :--- | :--- | :--- |
| **`aprmh`** | Appointment Reminders (for `ssm` client). | **Time-Boxed:** Targets appointments that fall within a 1-hour window, offset by a variable number of hours (`ofs`) before the appointment time. |
| **Status Filters** | Only targets appointments with a status of `'Not Confirmed'` or `'Confirmed'`. |
| **Exclusions** | Excludes appointments with the specific name `'Call Back'`, ensuring these are not processed by the automated reminder system. |
| **Time Zone** | Accurately uses the office's `utc_offset` to calculate the patient's local time for reminder processing. |

#### Touch Execution and Media Tracking
The execution flow for generating and tracking messages is standard across clients:

| Component | Description |
| :--- | :--- |
| **Touch Generation** | Creates `Touch` records in the database for each intended communication (SMS, Email, or Print). |
| **Message Substitution** | Executes personalization logic (`NudgeShared.substitute_message`) to replace placeholders (like `{{fn}}`) with patient and appointment data before sending. |
| **Touch Execution** | Calls the relevant service (`TouchService.call_api`) to queue or send the message, including an essential check for the patient's communication opt-out status. |
| **Media Buys Tracking** | Creates a **`MediaBuy`** record for any **Touch Step** configured for tracked marketing spend (e.g., Direct Mail), logging the cost, fulfillment details, and recipient list (`media_buys_recipients`). |

---
## Relevant Workflow Automation (Execution Layer)
This section the core execution and orchestration layers of Relevant Workflow Automation system. These scripts manage the scheduling, data import processing, and message consumption for Sycle and other client-specific integrations

The following processes run continuously in the background to maintain real-time data synchronization and trigger client-specific engagement workflows.

### Master Scheduler 
(process_realtime_activities.rb)

This script acts as the central orchestrator, ensuring that all client-specific data import and patient engagement jobs run at regular intervals during active business hours.

| Component | Description |
| :--- | :--- |
| **Purpose** | To orchestrate the execution of all client-specific real-time jobs (Data Sync and Nudge Processing). |
| **Schedule** | Runs continuously in a loop, executing a full cycle every **40 minutes** (`sleep 2400`). |
| **Operating Hours** | **Daytime Only:** Jobs are only triggered if the current UTC hour is between `15` and `24` (approximately **8am to 6pm MST/MDT**), preventing unnecessary execution during non-business hours. |
| **Execution** | All client jobs are executed concurrently within a new **Thread**, preventing one long-running data sync or message process from blocking all other client workflows. |
| **Jobs Executed** | **Data Refresh:** `mhc_refresh_sycle_appt_data`, `ssm_refresh_sycle_appt_data`, `bcb_concrete_import_customers_orders`. **Nudge Processing:** `mhc_process_nudges_and_touches`, `ssm_process_nudges_and_touches`, `bcb_process_nudges_and_touches`. |

### Sycle Data Processor: Appointment Queue 
(process_sycle_appt_refresh_queue.rb)

This process is the receiver and executor for the real-time appointment refresh requests initiated by clients (e.g., mhc_realtime_refresh_sycle_appt_data). It manages the complex logic of connecting to the external Sycle database and merging that data into the application's core tables.

| Component | Description |
| :--- | :--- |
| **Role** | Handles a comprehensive Sycle data refresh, synchronizing a wide range of data points including patients, appointments, and purchases. |
| **Key Function: `cassify`** | This unique function orchestrates the **address standardization** process (indicative of CASS, or Coding Accuracy Support System). It involves three steps: 1. Uploads a patient file to S3. 2. Sends a request to the **`Cassify:In`** SQS queue. 3. Waits for the standardized address data from the **`Cassify:Out`** queue. |
| **Synchronization** | Connects to the external Sycle database to retrieve and process: **Patients** (separated into `customers` and `prospects`), **Appointments**, and **Purchases**. |
| **Data Cleanup** | The process rigorously ensures a clean state by dropping all temporary tables (`tmp_patients_...`, `tmp_appointments_...`, etc.) upon the completion of the synchronization run. |

