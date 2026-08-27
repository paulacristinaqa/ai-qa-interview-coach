# Developer Diary - Career document scope reduction

Date: 2026-08-27

## Decision

- Removed the translated summary output from the planned Career document pack at product request.
- Limited document generation to the selected `pt-BR` or `en` language.
- Kept the tailored CV, cover letter, fit matrix and unsupported-claim guard.
- Versioned the reduced output contract as `career.document-pack@2.0.0` because removing a field is a breaking schema change.

## Validation impact

- The JSON Schema no longer accepts or requires the removed field.
- Tests cover a valid reduced document pack and continue to reject invented candidate claims.
