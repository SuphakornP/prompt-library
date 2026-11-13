---
name: fellow-decision-brief
description: Compare supplied options against explicit goals, constraints, and evidence to produce a decision brief with tradeoffs and unresolved questions. Use for a concrete choice; not for purchasing, financial advice, or inventing missing option data.
metadata:
  version: "1.0.0"
---

# Decision Brief

Help the user make a specific choice using the information they provide. Match their language, audience, and level of detail. Make the recommendation traceable to their priorities rather than to an opaque score.

## Inputs and scope

Use a decision to make, at least two described options, and any goals or constraints. Pasted proposals or notes are sufficient. If only one option is supplied, compare it with the stated requirements and mark the result as an evaluation, not a multi-option ranking. Ask for a missing priority only when it could change the choice; otherwise provide a conditional comparison.

This skill uses supplied text and arithmetic. It needs no browsing, spreadsheet service, code execution, or procurement connector. Do not imply that vendor claims, prices, or availability were checked outside the supplied material. Do not place orders, contact vendors, or update approval systems without a separate explicit request.

## Make the comparison fair

1. State the decision, scope, and decision-maker's desired outcome. Separate hard requirements from preferences. Do not silently turn a preference into a mandatory gate.
2. Extract each option's facts with source references. Mark absent information as unknown, not as zero, false, or a satisfied requirement. Keep a vendor's stated claim distinct from independently demonstrated evidence.
3. Normalize comparable quantities to the same unit, currency, quantity, and time period when the input supports doing so. Show material calculations and assumptions. Do not invent exchange rates, taxes, discounts, renewal prices, or implementation costs.
4. Assess hard requirements first. Distinguish meets, does not meet, and unconfirmed. An option with a critical unknown must not be called fully qualified.
5. Compare tradeoffs among qualified or conditionally qualified options. Use weights only if the user supplies or approves them. If offering a possible weighting scheme, label it as a proposal and keep it separate from the main conclusion.
6. Explain what would change the recommendation. Where missing data can reverse the result, make the recommendation conditional or describe the current shortlist instead of forcing a winner.

## Deliver the brief

Use [the output template](references/output-template.md) when helpful. Consult [the worked example](references/example.md) for cost normalization and an unknown hard requirement.

- Lead with a recommendation, conditional recommendation, or explicit reason the choice remains open.
- Include only criteria that affect the decision. Show the strongest advantage and meaningful compromise of the leading options.
- Explain the reasoning in plain language. A small price difference is not automatically decisive when a hard requirement is unresolved.
- Finish with the few questions or checks needed to decide, preserving any existing owners and deadlines. Proposed follow-up actions are not commitments.
- Return a textual brief unless the user requests another supported format. Do not claim that a purchase or approval has happened.

Before returning, check the arithmetic, unit consistency, treatment of unknowns, and whether the proposed choice actually satisfies every stated hard constraint.
