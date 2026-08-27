# Developer Diary - Manual Job Applications

Date: 2026-08-27

## Technical state found

- `/career/applications` existed only as a prepared empty route.
- Manual Job Opportunities already provided the source records required by an application pipeline.
- Authentication and user ownership were already consistently enforced in the API controllers and services.

## Delivered

- Added `JobApplication`, linked to one user and one `JobOpportunity`.
- Added manual stages, application date, next action, deadline and notes.
- Added authenticated CRUD endpoints with search and stage filters.
- Replaced the empty route with creation, editing, filtering, summary cards and removal UI.
- Added unit, API integration and frontend rendering tests.
- Extended the E2E smoke with create, filter, advance and remove application coverage while preserving its opportunity.
- Documented the REST contract and local QA flow.

## Deliberate boundaries

- One application is allowed per opportunity.
- Removing an application preserves the opportunity; deleting the opportunity cascades to its application.
- Job and application statuses are not synchronized implicitly.
- No scraping, email, calendar, notification or external integration was introduced.

## Next risks

- A future decision is required about explicit status synchronization between Jobs and Applications.
- Reminders and overdue indicators need timezone and notification rules before implementation.
- Company/contact normalization should be introduced with the future Companies module, not duplicated here.
