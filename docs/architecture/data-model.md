# Initial Data Model

## Entities

### users

- id
- name
- email
- password_hash
- locale
- created_at
- updated_at

### interview_sessions

- id
- user_id
- language
- target_role
- seniority
- topic
- interviewer_style
- difficulty
- status
- started_at
- completed_at

### interview_turns

- id
- session_id
- order_index
- question
- answer
- created_at

### feedback_reports

- id
- session_id
- overall_summary
- confidence_level
- model_name
- prompt_template_version
- created_at

### feedback_dimensions

- id
- report_id
- dimension
- score
- evidence
- recommendation

### learning_events

- id
- user_id
- session_id
- concept
- help_level
- retry_requested
- created_at

### technical_challenges

- id
- area
- title
- difficulty
- context
- evaluation_criteria
- model_solution
- created_at

### technical_attempts

- id
- challenge_id
- user_id
- answer
- feedback
- solution_revealed
- created_at

### knowledge_items

- id
- user_id
- type
- title
- body
- tags
- source
- created_at
- updated_at

### cri_snapshots

- id
- user_id
- score
- confidence_level
- composition
- evidence_gaps
- created_at

### diary_entries

- id
- user_id
- entry_type
- title
- context
- decision
- next_steps
- created_at
- updated_at

## Notes

- JSON fields can be used initially for composition, tags and criteria while the model is still evolving.
- Sensitive data should be minimized and never logged by default.
- Audio and pronunciation data are intentionally absent from the MVP model.

