# API performance-regression fixture environment

This repository is a deliberately difficult, bounded fixture for the API performance-regression workflow. It contains real GitHub pull requests, source diffs, merge commits, comments, issues, an `API Performance Tests` Actions workflow, and post-merge artifacts. The associated production measurements live in Supabase table `public.api_performance_results`.

## Historical-window adapter

GitHub owns `merged_at` and Actions run timestamps, so neither can be backdated through the public API. To make the fixed 01 May 2026–30 June 2026 IST evaluation window reproducible, [`.fixtures/historical-pr-index.json`](.fixtures/historical-pr-index.json) is the authoritative fixture adapter for historical PR merge times. It only supplies the impossible-to-backdate timestamp; source diffs, PRs, commits, comments, issues, Actions runs, and artifacts are all real GitHub resources.

Use only PRs with `backend_application_code: true`. Do not treat an ordinary GitHub `merged_at` timestamp as an alternative to the historical fixture timestamp in this environment.

## Evidence and data interpretation

- Each production table row is one completed daily benchmark aggregation. Its `p50_ms`, `p95_ms`, and `p99_ms` are already response-time percentiles. For each endpoint and each percentile column, calculate the previous-30-calendar-day arithmetic mean and sample standard deviation among complete production monitor rows; do not take a second percentile across the stored percentile values.
- A result is significant only where the observed value is **strictly greater than** mean + 3 sample standard deviations. A result exactly at 3.0 is a control, not a regression.
- Filter historical baselines to `environment = 'production'`, `source = 'synthetic_monitor'`, and `status = 'complete'`. The table contains staging and invalid-status decoys on purpose.
- `requests_24h`, `slow_rate`, and `timeout_rate` are the current production traffic and observed rates needed to calculate added slow requests and timeouts. Use the latest baseline rate for comparison.
- A primary Actions artifact must match the merge SHA and have all three percentile fields. When it is unavailable or invalid, look for the Supertest fallback artifact. A valid artifact does not make a PR valid if fewer than 30 prior daily baseline rows exist.

## Rerun markers

Use exact HTML markers, not title matching, to make follow-up idempotent:

```text
<!-- api-performance-regression:v1;pr=<pr>;endpoint=<url-encoded METHOD route> -->
<!-- api-performance-summary:v1;pr=<pr>;algorithm=rolling-30d-v1 -->
```

The fixture includes an already-open matching regression issue, a closed matching issue that must not block a new issue, and an existing marked PR summary comment. Search comment and issue bodies for the exact markers before creating anything.

