# Worked example: weekly support recap

This is synthetic practice material, not an executed report or automation.

## Input

User request: "Turn this successful weekly recap into a reusable blueprint. Produce text only. Do not publish or contact anyone."

Runbook supplied by the user:

- R1: The user supplies tracker rows and an as-of date for each run. Dates use YYYY-MM-DD. For this tracker, statuses are Open or Closed.
- R2: Exclude Closed rows from the open recap. An open item is overdue when its due date is earlier than the as-of date. Items due on the as-of date are not overdue.
- R3: Report open count, overdue open count, missing-owner count among open items, and missing-due-date count among open items. Include the affected ticket IDs.
- R4: Draft a short team update for review. Do not publish it or message ticket owners.

Successful example, as of 2026-11-13, Asia/Bangkok:

| ID | Status | Owner | Due date |
| --- | --- | --- | --- |
| T101 | Open | Pim | 2026-11-12 |
| T102 | Closed | Narin | 2026-11-10 |
| T103 | Open | Not specified | Not specified |

Previously accepted result: two open items; one overdue open item, T101; one open item with no owner, T103; one open item with no due date, T103.

## Expected output

### Purpose and applicability

Prepare a weekly support recap from supplied tracker rows using R1-R4. The supplied example demonstrates the core counting rules. This blueprint does not retrieve a tracker or publish the recap. Other tracker schemas need their own mapping before use.

### Input contract

| Field | Meaning | Missing or invalid handling |
| --- | --- | --- |
| As-of date | Date-only reporting cutoff, YYYY-MM-DD | Ask for it before calculating overdue status |
| ID | Traceable ticket identifier | Flag the row; resolve identity before presenting a reconciled final total |
| Status | Open or Closed | Unknown values remain unresolved; do not treat them as closed |
| Owner | Assigned owner | Missing is an explicit gap; do not assign an owner |
| Due date | Date-only deadline, YYYY-MM-DD | Missing is an explicit gap; do not classify the item as definitely not overdue |

The current rules compare calendar dates, not timestamp hours. The as-of date is a per-run input; 2026-11-13 is not a permanent cutoff.

### Procedure

1. Check that the reporting date and fields follow R1. Detect duplicate IDs and unknown statuses. Handling these is not defined in the original runbook; the proposed rule is to show the issue and request clarification before a reconciled final report, rather than silently drop or merge rows.
2. Select rows whose status is Open. Preserve their IDs for traceability. Exclude Closed rows from the open recap under R2.
3. For open rows with valid due dates, compare the due date with the supplied as-of date. Count only earlier dates as overdue. Track missing due dates separately.
4. Count open items, known overdue items, open items with missing owners, and open items with missing due dates under R3. These categories overlap and must not be added to infer a total number of distinct issues.
5. Draft the team update and show counts with affected IDs. Review it before any separate request to publish, as required by R4.

### Expected output for the supplied example

Open items: 2, T101 and T103. Known overdue open items: 1, T101. Missing owner: 1, T103. Missing due date: 1, T103. T102 is closed and does not contribute to these counts. T103's overdue status is unknown.

Draft: "We have two open items. T101 is overdue against the 13 November cutoff. T103 needs an owner and a due date, so its overdue status is not yet known. Please review those gaps before sharing a complete timeline."

### Representative checks to run before reuse

| Variation | Expected behavior | Status |
| --- | --- | --- |
| Supplied three-row example | 2 open, 1 known overdue, 1 missing owner, 1 missing due date | Consistent with the supplied accepted result |
| Change T101 due date to 2026-11-13 | 0 known overdue; T103 still has an unknown due date | Derived from R2; not executed here |
| Change T103 status to Waiting | Flag unsupported status; do not silently exclude it as closed | Proposed exception rule; not executed here |
| Supply T101 twice | Flag duplicate identity before a reconciled final count | Proposed exception rule; not executed here |

Confirm the proposed exception rules with the process owner. No automation, installed skill package, scheduled run, or published recap has been created by this blueprint.

## Observable checks

- Closed ticket T102 is excluded even though its due date is earlier than the cutoff.
- T103's missing due date is not treated as evidence that it is on time.
- Missing-owner and missing-date counts are not added as different tickets.
- The cutoff is a reusable input, and proposed exception rules remain distinguishable from the supplied runbook.
