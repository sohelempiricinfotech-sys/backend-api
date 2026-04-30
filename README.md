## business-service

Gateway/orchestrator for user-related flows. Exposes public endpoints and delegates to `user-service` where needed.

### Run (dev)

```bash
npm install
npm run dev
```

- Port: `PORT_BUISNESS_SERVICE` (default 3001). In dev Docker it's exposed on 3000.
- Health: `GET /health`

### Endpoints (mounted at `/user`)

- POST `/user/auth/login`
- POST `/user/auth/verify`
- POST `/user/auth/request-password-reset`
- POST `/user/auth/reset-password`
- POST `/user/auth/logout`
- POST `/user/auth/refresh-token`
- POST `/user/auth/verify-token`

### Environment

Required DB vars:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

Other typical vars (add as needed):

- JWT secret(s), token TTLs, upstream service base URLs

### Performance-regression test fixture

See [PERFORMANCE_REGRESSION_FIXTURES.md](PERFORMANCE_REGRESSION_FIXTURES.md) for the intentionally challenging, bounded fixture used to exercise post-merge API performance analysis.


