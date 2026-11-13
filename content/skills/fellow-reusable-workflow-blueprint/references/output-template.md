# Reusable workflow blueprint structure

Use the user's language and keep the level of detail appropriate to the task. This document is a specification, not an executed workflow.

## Purpose and applicability

Describe the recurring task, trigger, intended output, and cases outside its scope. State whether the workflow is based on a demonstrated example or is entirely proposed.

## Input contract

| Input or field | Meaning and format | Required / optional | Handling when missing or invalid |
| --- | --- | --- | --- |

Keep run-specific data separate from persistent rules. Note any supplied timezone, units, or definitions needed for interpretation.

## Procedure and decisions

Number the essential transformations and checks. Label rules introduced by this blueprint as proposals. Specify where a material ambiguity requires clarification.

## Output and acceptance checks

Describe the expected structure, evidence links, reconciliations, and review gate. Do not imply that an external destination has been updated.

## Representative cases

| Input variation | Expected behavior or result | Demonstrated / proposed |
| --- | --- | --- |

Provide enough concrete data to make the check observable. Distinguish a described case from an executed test.

## Open decisions

List unresolved rules, missing permissions, or untested conditions that matter before the workflow can be reused or implemented.
