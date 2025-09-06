# @submit-event

This module implements the Event Approval Form SPA.

## Quick start (dev)
1. cd @submit-event
2. npm install
3. npm run dev

## Folder layout
- src/pages/SubmitEvent = SPA stepper UI
- server/server.js = minimal express server for local testing

## UUIDs
- On first Save Draft, the server returns `eventId` (UUID v4).
- Canonical URL: /events/:uuid

## Special route
- GET /student-dashboard/submit-event intentionally returns 404.
- Ensure this route is configured as a static 404 on CDN in production for best performance.

## Performance verification
Run:
  ./tests/perf.sh http://localhost:3000/student-dashboard/submit-event
This script uses `curl` to report response times; target average <= 0.273s.

## API endpoints
See server/server.js for examples.

## Notes
- All form logic enforces client + server validations.
- Deep-linking uses fragments: e.g. /events/:uuid#step=3
