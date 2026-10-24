# Explain unavailable Gmail capture

## Affected areas and approach

The screenshot shows an expanded manager reply; current-message capture deliberately
accepts incoming messages only. Distinguish this condition from no open message,
missing account identity, unreadable Gmail markup and a disconnected content script.
Carry bounded diagnostic reasons through validated messages, clear previous context,
and show actionable panel guidance with a retry control. Never use a collapsed
client message or quoted reply as a substitute for the selected message.

## Verification

Add parser/envelope regression coverage for each diagnostic reason. Run root checks
and a fresh Chromium flow with an outgoing message, then an incoming message.
Ask Sergi to reload the extension/Gmail and expand the incoming fictional message;
real Gmail markup remains subject to that manual check.
