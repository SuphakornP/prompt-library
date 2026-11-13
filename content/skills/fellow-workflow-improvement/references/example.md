# Worked example: expense-request rework

This is synthetic practice material, not an audit of a real business process.

## Input

User request: "Suggest one small improvement to our reimbursement process. Keep email intake, the existing tracker, and manager approval. Do not change any live process."

Current description:

- P1: An employee emails an expense request with an amount and receipts.
- P2: A finance administrator checks the request. If a receipt is missing, the administrator asks the employee to resend the complete request.
- P3: Complete requests go to the manager, who reviews them on Fridays.
- P4: After approval, the administrator records the approved request in the existing tracker and passes it to the payment team. The payment team's later steps are outside this review.
- P5: Last week there were 10 requests. Four were missing receipts on first arrival. Three were waiting for manager approval at the end of the week. The notes do not say whether these groups overlap. No handling or waiting-time measurements are available.

## Expected output

### Main recommendation

Test a short completeness checklist in the existing email request format. Missing receipts affected four of last week's 10 requests, so improving the initial handoff is a concrete place to test. Keep manager approval, the tracker, and the payment-team handoff unchanged. The checklist's effect has not been measured.

### Current process

| Step | Role | Action and handoff | Evidence |
| --- | --- | --- | --- |
| 1 | Employee | Email amount and receipts to finance | P1 |
| 2 | Finance administrator | Check completeness; request a complete resend if receipts are missing | P2 |
| 3 | Manager | Review complete requests on Fridays | P3 |
| 4 | Finance administrator | Record approved requests and hand them to payment team | P4 |

The process under review ends at the handoff to the payment team. Payment timing is unknown and is outside scope.

### Pain points and constraints

Four of 10 requests lacked receipts on first arrival (P5). A clearer request checklist might help employees notice missing attachments; this is a hypothesis, not an established cause. The three requests waiting for manager approval describe a separate observation. They cannot be added to the four incomplete requests to claim seven distinct delayed requests, because overlap is unknown.

### Proposed change

Keep email as the entry point. Add a brief checklist to the request instructions: state the amount and confirm that receipts are attached. The administrator still checks completeness, uses the existing resend process when necessary, and sends only complete requests to the manager. The Friday review and post-approval tracker step remain intact.

The finance process owner would need to agree to the revised instructions before use. No live instructions, tracker, or assignments have been changed.

### Proposed experiment

Try the checklist with the next 10 requests and review the results afterward. This is a proposed test size, not an approved rollout.

- Compare the number missing receipts on first arrival with the observed baseline of four out of 10, while noting any difference in request mix.
- Record how many clarification/resend exchanges occur per request; this measure has no historical baseline in the supplied notes.
- Ask whether the checklist adds confusion or unnecessary work. Retain it only if the review suggests it improves completeness without disproportionate burden.
- Do not claim hours saved: no time measurements are available. Keep approval delays visible as a separate issue for later investigation.

## Observable checks

- Email intake, the existing tracker, and manager approval remain in the proposed process.
- Four incomplete requests and three approval waits are not added as distinct cases.
- The suggested checklist and test size are labeled as proposals.
- No savings, completion-time reduction, or implemented change is claimed.
