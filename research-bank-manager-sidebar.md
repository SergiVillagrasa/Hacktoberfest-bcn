# Bank manager sidebar: research and proposed product scope

Prepared on 24 October 2026 for Sergi, Albert and Joana.

This project-folder copy preserves the research and proposed product scope. Implementation follows [architecture.md](architecture.md), with concise plans in [docs/implementation_plans](docs/implementation_plans/README.md). Architectural boundaries take precedence over the earlier shorthand below.

## Product purpose

Help a relationship manager recover the relevant context about an existing client before answering, meeting them, or considering a service or commercial decision. The intended scenario is a manager responsible for 80–100 clients; this number comes from our product scenario, not a measured industry average.

The core deliverable is a concise client briefing in Gmail: what matters now, what remains unresolved, what the client has told us they need, and which messages support that context. Reply drafting is optional. The manager decides how to handle the relationship, fees and offers.

## What the research supports

These sources cover different populations. The relationship-manager research includes North American commercial and other banking segments; the customer evidence includes Spanish complaints and US retail banking. They support design hypotheses for this prototype, rather than validating every Spanish retail manager's workflow. We have not interviewed bank managers yet.

1. **Finding and preparing context consumes time.** McKinsey's October 2025 survey covered 406 banking managers and individual contributors in the US and Canada. Excessive administration, lead quality and difficult meeting preparation were its leading reported challenges. For our existing-client scope, the applicable problem is gathering context before conversations. [McKinsey: Agentic AI is here. Is your bank's frontline team ready?](https://www.mckinsey.com/industries/financial-services/our-insights/agentic-ai-is-here-is-your-banks-frontline-team-ready)
2. **Fees and unresolved service problems are concrete relationship concerns.** Banco de España reports that fraud represented almost 28% and fees/expenses 13% of complaints admitted in 2025. These are escalated complaints, not prevalence estimates for all bank customers. [Banco de España: Servicio de reclamaciones — Memoria de 2025](https://clientebancario.bde.es/pcb/es/blog/servicio-de-reclamaciones-del-banco-de-espana-que-es-y-que-datos-deja-la-memoria-de-2025.html)
3. **Trust, clear fees and problem resolution affect customer experience.** J.D. Power's 2025 US retail study covered 109,724 customers and highlights fee understanding and resolving problems promptly. This supports surfacing the issue's history and what the bank has done about it. [J.D. Power: 2025 U.S. Retail Banking Satisfaction Study](https://www.jdpower.com/business/press-releases/2025-us-retail-banking-satisfaction-study)
4. **Maintaining conversation notes and follow-up items is an established advisor use case.** Morgan Stanley's Debrief announcement describes summaries, action items and notes saved to the CRM, with advisors reviewing draft outputs. This is evidence of an existing industry use case, not proof of our prototype's performance. [Morgan Stanley: AI Debrief launch](https://www.morganstanley.com/press-releases/ai-at-morgan-stanley-debrief-launch)
5. **Investment decisions need more than email history.** MiFID II Article 25 requires information on knowledge/experience, financial circumstances and objectives, including risk tolerance and loss-bearing capacity, when providing investment advice. Our sidebar can surface stated needs and missing information; email tone cannot establish suitability. [ESMA: Article 25](https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mifid-ii/article-25-assessment-suitability-and)
6. **Emotion labels in text are uncertain.** A 2026 study with 500 annotators and 250 ambiguous texts reports difficulty agreeing on emotions; adding demographic author information did not improve agreement. We should show contextual communication signals and their evidence, with an unclear state. [Weber, Greschner and Klinger: Less Is More?](https://aclanthology.org/2026.lrec-1.646/)

## Turn the concerns into sidebar behavior

These features are our design proposals derived from the research.

| Manager's need | Sidebar implementation | Example content | Priority |
|---|---|---|---|
| Recover context quickly | A brief of at most three evidence-linked points, led by current unresolved concerns | Fee query repeated; response promised; saving for a planned purchase | Core |
| Avoid making the client explain the same issue again | Concern cards with first/last mention, linked messages and reviewed status | Maintenance-fee query: open; mentioned in two recorded messages | Core |
| Remember what was promised | Open commitments with owner, explicit due date if known, and a manual resolution control | Manager promised a fee explanation by Friday | Core |
| Remember the client's priorities | Stated goals, constraints and contact preferences, with dates and excerpts | Saving for a home deposit next year; prefers a morning phone call | Core |
| Understand the recent conversation | Topic-specific communication signals linked to individual messages | Expressed frustration about repeated fees; appreciation for the last call | Core, kept small |
| Prepare a fee or offer discussion | Expandable decision context using the facts already displayed, plus missing bank information | Fee review requested; current tariff and discount authority not loaded | Basic context in core; richer view later |
| See what changed since the last conversation | Short dated timeline and a review card for possible updates to confirmed facts | Contact preference may have changed from afternoons to mornings | Timeline in core; change review is the accepted stretch feature |

## Communication signals and relationship progress

Label the section "Recent communication", and attach every observation to its topic and date. Distinguish an explicit statement such as "I am worried about this fee" from a tentative interpretation of tone. The latter remains an AI suggestion, can be corrected, and can be unclear. Treat it as a signal about a message, not a permanent attribute of the person.

A manager can inspect whether a particular concern progressed from raised, to acknowledged, to resolved, and whether the client explicitly confirmed resolution. A positive message about one topic does not erase a complaint about another. An inferred emotion cannot establish that the manager caused the client's mood or quantify the manager's performance.

If a client explicitly mentions moving banks, show the statement as a source-backed concern. Do not invent a churn probability from tone. Emotion may help the manager choose an empathetic opening; pricing and product discussions need the client's stated needs and the bank's verified records and policies.

## Sidebar content order

1. Client identity and coverage: which messages are available and when context was last updated.
2. What matters now: at most three points combining recent concerns and unresolved commitments.
3. Goals and preferences: a few stable, reviewed facts relevant to the current conversation.
4. Recent communication: one or two dated signals with excerpts, including unclear if appropriate.
5. Expandable history, evidence and missing information. Keep reply drafting a secondary action if time remains.

Each item should reveal the source message and exact excerpt. Display suggested and manager-confirmed information distinctly. A quotation occurring in an email proves the text exists there; the manager still needs to judge whether it supports the extracted interpretation.

## Historical context is a necessary input

The planned content script reads the visible Gmail message. It does not fetch the client's whole mailbox history. Persisting reviewed information from messages already viewed builds history progressively, but cannot reconstruct earlier conversations that were never captured.

For the five-hour demo, create and import a small fictional history at the event: roughly three to five messages for the principal client, including outgoing manager messages where commitments are needed. Process the history locally once and cache it. Open a new fictional message in real Gmail to demonstrate the live extension and live Qwen analysis against that recorded history. Include a second client or an unknown sender to check isolation.

Show coverage honestly, such as "4 imported sample messages + current Gmail message". If only incoming emails are available, an unanswered request remains "resolution not recorded"; absence of an outgoing email is not proof that the manager never answered. Likewise, a client reporting a promise differs from having the manager's original promise in the history.

## A feasible implementation with the agreed stack

Keep WXT, React, TypeScript, Vitest, Ollama/Qwen3 1.7B and local extension storage in the agreed Bun-workspace monorepo. Shared contracts belong in packages/contracts, business use cases and ports in packages/core, and Chrome/Ollama adapters in packages/infra. Store message IDs, direction, available timestamps, exact text and source type alongside extracted context items.

Use a bounded extraction response for the current message: concern, commitment, goal, preference or communication signal, each with a source message ID and excerpt. Begin with at most five items total. Group items into the sidebar sections in a core briefing use case, with React rendering its result. Calculate counts and elapsed dates in core from available records, and let the manager confirm resolution. Unknown dates and incomplete coverage stay unknown.

Keep current-message suggestions visible as suggestions; manager acceptance adds stable facts to the confirmed profile. Store communication signals against their messages. Analyze each unique email once, cache its result, and refresh only for new content. A small client-specific history is sufficient for the demo; no new memory infrastructure is required.

## Demonstration and evidence of value

Use a fictional client who has queried a fee, received a promise of an explanation, and written again. Their history also states a savings goal and contact preference. The manager opens the newest email; the sidebar immediately exposes the repeated concern, recorded promise, relevant goal and source excerpts. The manager can then make a better prepared response or fee-review discussion.

Measure time to answer the same three questions from raw email history and from the sidebar: What is this client's current concern? What did we promise? What goal or preference matters here? Record whether answers are supported by the messages. A target such as finding the key context within 30 seconds is a prototype goal, not a proven result. A small team rehearsal cannot establish improved financial decisions or performance across a real 100-client portfolio.

## Stretch feature agreed with Sergi

Once the briefing flow works, show possible changes to a confirmed preference with old and new excerpts. The manager can keep the existing value or approve the replacement. Preserve the prior value as history and use only current confirmed values in later briefings.

## Community implementation notes

Two developer write-ups were inspected, with no comments returned for either. They are individual project reports rather than banking research:

- Srinath's [I Gave My AI Assistant a Memory — It Started Calling Out My Broken Promises](https://dev.to/tsrinath/i-gave-my-ai-assistant-a-memory-it-started-calling-out-my-broken-promises-3kj8) illustrates a briefing centered on outstanding promises and their evidence. We can adopt that product focus with our existing local store.
- [Your AI cited a real file. It still lied to you.](https://dev.to/enhanciar_ai_96a4ba4877e3/how-we-make-an-llm-cite-every-answer-down-to-fileline-and-check-the-citation-is-telling-the-truth-hmj) describes the distinction between a real citation and a supported claim. Our UI should preserve review and uncertainty even when a literal excerpt is present.
