---
name: fellow-workflow-improvement
description: Examine a supplied recurring process and its pain points to propose a focused, testable workflow improvement. Use when the user has steps, roles, or examples to inspect; not for claiming measured savings or executing process changes.
metadata:
  version: "1.0.0"
---

# Workflow Improvement

Make a recurring process easier to understand and improve without losing its important controls. Match the user's language, audience, and constraints. Produce a current-state map and a small, reviewable improvement experiment.

## Inputs and scope

Use a description of the current steps, roles, handoffs, and a pain point. Examples, volumes, waiting times, policies, and existing tools help when available, but pasted text is sufficient. If no current process is described, ask for a representative case or a short step list before diagnosing a cause.

This skill needs no system access, code, integrations, or web research. A process described in notes has not been independently observed. Treat its reported facts as supplied evidence. Implementing automations, changing permissions, assigning work, or altering an external tracker requires a separate explicit request.

## Understand the current process

1. Identify the trigger, input, desired output, boundaries, and what counts as complete. Preserve stated approval, review, or separation-of-duty requirements.
2. Map the actual sequence using supplied roles. Show each handoff's input and output. Mark unknown steps or ownership explicitly rather than completing an idealized process from assumptions. Put activities with unknown timing in a separate unplaced-activity row or section; do not give them a numbered position in the confirmed sequence.
3. Locate delays, rework, unclear decisions, or duplicate entry. Tie each pain point to an observation or concrete example. Separate symptoms from suspected causes.
4. Preserve counts and periods. Check whether categories overlap before adding them. Do not infer cycle time, labor savings, error reduction, or capacity gains from counts alone.
5. Identify constraints that a proposal must respect, such as retaining an email entry point, using an existing tracker, or keeping manager approval. Do not recommend removing a control simply because it creates a wait.

## Propose a bounded change

- Prefer one small change that addresses an observed issue and can be tested with the existing process. Make additional ideas secondary rather than turning a focused request into an organization redesign.
- Show the revised steps and what changes at the handoff. Distinguish retained controls from proposed additions. Suggested owners are not assigned owners unless the input grants that role.
- Explain the mechanism as a hypothesis: how the change could reduce the observed problem and what could make it fail.
- Define a practical experiment with proposed scope, measures, and a review point. Use a supplied baseline when available. If none exists, include collecting it; do not invent a numerical improvement target or promise savings.
- Include exceptions that affect the proposed change, such as incomplete inputs or an unavailable approver. Keep this specific to the user's process.

Use [the output template](references/output-template.md) for the current/proposed comparison. Consult [the worked example](references/example.md) for overlapping counts and an approval constraint.

## Deliver and check

Lead with the observed problem and the proposed test. Present enough detail for a process owner to assess it, using a compact table or numbered steps. Return text unless the user requests another supported format.

Before returning, verify that the current-state map does not contain invented steps, the proposal respects every stated control, measures can actually reveal whether the change helped, and no proposed action is described as already implemented or approved.
