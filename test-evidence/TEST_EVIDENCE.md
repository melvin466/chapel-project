# Chapel System Test Evidence

Generated: 2026-06-11 15:00:52 -04:00  
Commit tested: 53587cf  
Machine path: C:\Users\HP\Desktop\chapel-system

## Commands Run

| Area | Command | Result | Evidence Log |
| --- | --- | --- | --- |
| Backend unit + integration/API tests | 
pm.cmd test from ackend/ | PASS: 6 suites, 32 tests | ackend-jest.log |
| Frontend component/integration tests | 
pm.cmd run test:run from rontend/ | PASS: 9 files, 18 tests | rontend-vitest.log |

## Backend Coverage By Test Type

Unit/service-level evidence:
- ackend/tests/smsParser.test.js: validates Uganda mobile money SMS parsing.
- ackend/tests/relworxService.test.js: validates Relworx service error handling.
- ackend/tests/middleware.test.js: validates auth middleware behavior for missing/valid tokens.

Integration/API evidence:
- ackend/tests/authController.test.js: registration, login, email verification, password reset, bookings, cells, donations, audit logs.
- ackend/tests/eventController.test.js: event registration rules, cancellations, check-ins, exports, stats, feedback.
- ackend/tests/reportController.test.js: report summaries and CSV export endpoints.

Backend result summary from log:
`	ext
Test Suites: 6 passed, 6 total
Tests:       32 passed, 32 total
Snapshots:   0 total
Time:        13.925 s, estimated 16 s
Ran all test suites.
`

## Frontend Coverage By Test Type

Component/unit-style evidence:
- rontend/src/__tests__/Footer.test.jsx
- rontend/src/__tests__/Navbar.test.jsx
- rontend/src/__tests__/LoginPage.test.jsx

Frontend integration-style evidence:
- rontend/src/__tests__/BookingsPage.test.jsx
- rontend/src/__tests__/AdminBookings.test.jsx
- rontend/src/__tests__/AdminDonations.test.jsx
- rontend/src/__tests__/DonationsPage.test.jsx
- rontend/src/__tests__/HomePage.test.jsx
- rontend/src/__tests__/NotificationsPage.test.jsx

Frontend result summary from log:
`	ext
Test Files  9 passed (9)
Tests       18 passed (18)
Duration    8.38s
`

## Evidence Files

- 	est-evidence/backend-jest.log
- 	est-evidence/frontend-vitest.log
- 	est-evidence/test-summary.png

## Notes

- Backend tests used Jest with NODE_ENV=test and exercised both isolated service logic and HTTP API flows through Supertest/in-memory MongoDB.
- Frontend tests used Vitest and React Testing Library to verify UI rendering, interactions, and mocked service flows.
- A real browser screenshot was not available because the in-app browser automation tool was not exposed in this session. A generated PNG summary is included as screenshot-style evidence.