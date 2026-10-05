# Cogulator Chunk Naming: A Practical Guide

## Purpose

Use a named chunk to represent a specific piece of information that the user must keep in working memory and use again later in the modeled task. In Cogulator, write a chunk inside angle brackets, for example `<selected_runway>`.

Chunk naming is not a way to label every object, action, or line in a GOMS model. Add a chunk only when it improves the model of memory demand.

## Quick decision rule

Name a chunk only when all of the following are true:

1. The user perceives, recalls, or thinks about a distinct piece of information.
2. A later step depends on retaining or retrieving that same information.
3. The information is relevant to the task outcome, not merely visible on the interface.

If any answer is no, do not name a chunk.

## When to use a named chunk

Use a named chunk when the user must retain information across one or more intervening actions. Typical cases include:

- A selected aircraft, airport, runway, or equipment item that will be acted on later.
- A status, alarm condition, identifier, value, or instruction that must be checked again later.
- A value read in one place and entered, compared, confirmed, or acted on in another place.
- A remembered decision or task state that controls a later method or selection rule.

Example: the user reads an alarm identifier, navigates to another view, and then acknowledges that same alarm.

```text
Goal: Acknowledge alarm
. Look at <alarm_identifier>
. Point to Alarm Details
. Click Alarm Details
. Recall <alarm_identifier>
. Point to matching acknowledge control
. Click acknowledge control
```

The identifier is named because it must survive the intervening navigation and is used again to identify the correct alarm.

## When not to use a named chunk

Do not name a chunk for:

- A control that is immediately pointed to and clicked.
- Information that remains continuously visible and is not mentally retained for a later action.
- Every visible label, typed character, or physical object in the interface.
- A general skill or long-term knowledge the user is assumed to possess.
- Information that is read once and never used again.

Example: no chunk is needed here.

```text
Goal: Open alarm details
. Look at Alarm Details
. Point to Alarm Details
. Click Alarm Details
```

The button is an immediate target, not information that must be retained in working memory.

## How to name chunks

Use short, stable, meaningful names. Prefer the information's role in the task over its screen position or visual appearance.

Good names:

- `<selected_equipment>`
- `<alarm_identifier>`
- `<reported_runway_status>`
- `<clearance_value>`
- `<acknowledgment_needed>`

Avoid vague or presentation-specific names:

- `<data>`
- `<thing>`
- `<red_cell>`
- `<screen_text>`
- `<item1>`

Use one chunk for one unit that is remembered and reused together. Use separate chunks when values can be used independently. For example, use `<selected_aircraft>` and `<assigned_altitude>` separately if the model later needs one without the other.

## Pair chunks with appropriate Cogulator operators

A named chunk should appear with an operator that places information in working memory, refreshes it, or tests whether it remains available. Cogulator recognizes chunk use with operators such as `Look`, `Recall`, `Search`, `Perceptual_processor`, `Hear`, and `Think`.

```text
. Look at <reported_runway_status>
. Think <reported_runway_status>
. Recall <reported_runway_status>
```

Do not introduce a chunk on an unrelated motor action such as `Point`, `Click`, or `Hands` unless the model also explicitly represents the associated perception or thought.

## A lightweight modeling workflow

1. Write the GOMS method without chunks.
2. Mark information that is acquired in one step and needed later.
3. Add a named chunk at the first relevant perception, recall, or thought step.
4. Refer to the same chunk when the user later retrieves, verifies, compares, or acts on it.
5. Remove chunks that do not affect a later decision or action.

Start with the fewest chunks that accurately represent the task. Add more detail only when the task's working-memory demand matters to the analysis.

## Guidance for LLM-generated GOMS

When generating GOMS for Cogulator:

- Use a named chunk only for information that must be retained and reused later in the same modeled method.
- Do not create chunks solely because a label, control, or status is present on screen.
- Reuse the exact same chunk name for the same information item.
- Do not invent remembered information that is not required by the described task.
- If the task description does not establish a memory requirement, omit the chunk.

## Source

Adapted from the working-memory guidance in [Cogulator: A Primer](https://cogulator.io/resources/primer.pdf), especially its explanation that named chunks use angle brackets and are modeled through perception, recall, and thinking operators.
