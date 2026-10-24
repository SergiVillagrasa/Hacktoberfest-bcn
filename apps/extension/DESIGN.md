---
name: Client Brief
description: Calm evidence-first briefing for relationship managers.
colors:
  primary: "#0b57d0"
  primary-soft: "#e8f0fe"
  canvas: "#f8fafd"
  surface: "#ffffff"
  surface-soft: "#f1f3f4"
  ink: "#202124"
  muted: "#5f6368"
  divider: "#dadce0"
  confirmed: "#137333"
  confirmed-soft: "#e6f4ea"
  attention: "#a65a00"
  attention-soft: "#fef7e0"
  error: "#b3261e"
  error-soft: "#fce8e6"
typography:
  headline:
    fontFamily: '"Google Sans", system-ui, "Segoe UI", Arial, sans-serif'
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: '"Google Sans", system-ui, "Segoe UI", Arial, sans-serif'
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: '"Google Sans", system-ui, "Segoe UI", Arial, sans-serif'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  app-title:
    fontSize: "16px"
    fontWeight: 600
  state-title:
    fontSize: "15px"
    fontWeight: 600
  observation:
    fontSize: "12px"
    fontWeight: 500
  metadata:
    fontSize: "10px"
    fontWeight: 400
  label:
    fontFamily: '"Google Sans", system-ui, "Segoe UI", Arial, sans-serif'
    fontSize: "11px"
    fontWeight: 500
rounded:
  label: "4px"
  input: "6px"
  inset: "8px"
  banner: "10px"
  model-note: "9px"
  state-icon: "14px"
  button: "18px"
spacing:
  tight: "4px"
  related: "8px"
  group: "12px"
  page: "16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.button}"
    padding: "7px 12px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "7px 12px"
  evidence:
    backgroundColor: "{colors.surface-soft}"
    rounded: "{rounded.inset}"
    padding: "9px 11px"
---

# Design System: Client Brief

## Overview

A calm, precise Google Workspace-inspired utility beside Gmail. The interface
supports a manager reading recorded context, inspecting its evidence, and making
an explicit review decision. Preserve the existing identity when adding features.

The visual system uses compact typography, a cool canvas, tonal insets, thin
dividers, and restrained line icons. Density serves scanning without hiding
uncertainty or turning model output into an authoritative financial judgment.

## Colors

Primary blue marks actions, focus, and manager commitments. Neutral surfaces
separate evidence from interpretation without adding decorative shadows.
Amber identifies concerns and suggestions awaiting review; green identifies
manager-confirmed context. Red marks errors. Every semantic color also has a
written label or icon; color alone never carries the meaning.

**The Evidence Rule.** A blue source treatment is not a confidence score. Never
color an AI interpretation as verified simply because its excerpt matches.

## Typography

Use the browser utility's existing system sans stack, without a remote font
request. The client name is the largest heading; the application title is smaller
(16px), followed by section titles. Observation text and source quotations use
compact body copy (12px). Metadata uses 10–11px text and must retain contrast.
Counts use tabular numerals. Long addresses, excerpts, and identifiers wrap.

## Layout

One column, capped at 480px, with 16px page gutters and 12px gutters at the
narrowest breakpoint (320px). The minimum supported canvas is 280px. Keep the
manager's primary reading path visible: identity and coverage, open concerns and
commitments, then goals/preferences and message-specific signals. History and
import tools sit below the brief. Show up to three observations per group before
an explicit disclosure; do not imply that the first three are an AI risk ranking.

Use native details/summary for evidence and message bodies. This surface's task
mode and composition are recorded in `../../docs/design_plans/sidepanel.md`.

## Elevation & Depth

Use one-pixel dividers and soft fills. The panel has no decorative elevation or
floating cards. Evidence is a tonal inset inside an otherwise open list row.

## Shapes

Small rounded squares hold semantic line icons; compact rectangles hold review
labels. Pill buttons are reserved for actions. Consistent SVG strokes distinguish
concerns, commitments, goals, preferences, and communication signals. Incoming
and outgoing arrows identify message direction, never relationship quality.

## Components

### Context row and evidence

A concern triangle, commitment checklist, goal target, preference sliders, or
message bubble supports the written kind label. Review status remains explicit:
Needs review or Confirmed. Opening a row reveals the exact quotation, original
message ID, model origin, and applicable confirm/dismiss/resolve actions.

### Recorded message

A direction arrow accompanies the subject and date. Details retain the full
message, sender/recipient, and captured/imported origin. Unknown dates stay unknown.

### Actions and state feedback

Buttons retain visible focus, hover, active, disabled, and error states. Status
notices use neutral informational blue rather than claiming every update succeeded.
Use 140ms control feedback and 180ms evidence/status fades. Disclosure chevrons
rotate in place; content does not slide or bounce. A spinner runs only while
analysis is pending. No list entrance choreography or animated counts.

With reduced motion, remove animations and transitions. Keep static loading text,
state labels, and changed colors visible immediately. Never delay access to content.

## Do's and Don'ts

- Do keep concerns and open commitments easiest to find.
- Do pair semantic icons and colors with written labels.
- Do preserve exact evidence and distinguish suggestions from confirmed context.
- Do use native keyboard-operable disclosures and visible focus.
- Do respect reduced motion and narrow panel sizes.
- Don't introduce confidence gauges, emotional profiles, or manager scores.
- Don't add decorative charts, repeated cards, shadows, or page-load choreography.
- Don't invent dates, urgency rankings, product claims, or complete history.
