# Developer Diary - Job-specific Grill Me

Date: 2026-08-27

## Technical state found

- Grill Me already generated opening and follow-up questions through the AI Gateway with deterministic fallback.
- Sessions did not preserve any link to a Job Opportunity.
- The answer lookup used only the session ID and did not also enforce user ownership.

## Delivered

- Added optional `opportunityId` to the existing Grill Me start contract.
- Grounded opening questions and follow-ups in the owned vacancy description and structured analysis.
- Preserved the vacancy reference in existing interviewer metadata, avoiding a new database relation in this small delivery.
- Added `Treinar para esta vaga` to Job detail and loaded context through `/grill-me?opportunityId=...`.
- Suggested topic, language and level from the vacancy while keeping every setting editable.
- Versioned the expanded prompt as `grill-me.question@1.1.0`.
- Enforced session ownership when answering Grill Me questions.
- Extended the E2E smoke with vacancy-grounded opening and follow-up assertions.

## Deliberate boundaries

- Generic Grill Me sessions continue to work without a vacancy.
- No new paid provider or external integration was introduced.
- Vacancy context is not copied into a new table; the source remains the owned Job Opportunity.
- Question quality remains deterministic with the default mock provider and richer only when local Ollama is enabled.

## Next risks

- Deleting a vacancy during an active targeted session makes subsequent follow-ups unavailable; a future snapshot policy may be preferable.
- More precise topic selection will require mapping question-bank competencies to extracted vacancy requirements.
- A future report should compare Grill Me evidence with vacancy gaps instead of showing only per-answer feedback.
