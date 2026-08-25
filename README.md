# Vanaja Diagnostic Centre — App

Static web app for Vanaja Diagnostic Centre: bookings, AI report insights, health
packages, family health, lab operations, and more. Served as plain HTML/JS —
open with any static server (e.g. `python -m http.server 8642`).

## Structure
- Root: patient-facing pages (index, tests, packages, booking, reports, …)
- `admin/`: Operations OS (dashboard, offers, patients, lab workflow, phlebotomist)
- `assets/js/app.js`: shared data, chrome, smart search
- `assets/js/ai-llm.js`: optional live LLM connector (user-supplied key)
- `.github/workflows/upload.yml`: CI workflow — uploads a file on pull_request

## Pricing integrity
All "Save N%" figures are computed from real configured prices — never hardcoded.
