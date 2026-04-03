# FixMate Multi-Tab Auth Flow

This diagram explains how the new session header based authentication works across multiple tabs without conflicts.

```mermaid
sequenceDiagram
    participant Tab as Browser Tab (sessionStorage)
    participant FE as Frontend (React / api.js)
    participant MW as Backend (sessionHeader)
    participant ES as Backend (express-session)
    participant DB as MongoDB (Sessions)

    Note over Tab, DB: LOGIN FLOW
    Tab->>FE: User enters email + password
    FE->>ES: POST /login (credentials)
    ES->>FE: { success: true, sessionId: "abc123" }
    FE->>Tab: sessionStorage.setItem("fixmate_sid", "abc123")
    
    Note over Tab, DB: SUBSEQUENT API CALLS (e.g., getting user profile)
    Tab->>FE: Component mounts, needs data
    FE->>FE: getSessionId() reads "abc123"
    FE->>MW: GET /profile (Header: X-Session-Id: "abc123")
    
    Note over MW: Middleware detects X-Session-Id header
    MW->>MW: Sign "abc123" -> create signed cookie string
    MW->>MW: Inject signed string into req.headers.cookie
    
    MW->>ES: Passes request to express-session
    Note over ES: express-session thinks request came with a cookie!
    ES->>DB: Lookup session "abc123"
    DB->>ES: Session Data { role: "user", email: "..." }
    ES->>FE: JSON Response with user data
```

## Why this approach?
- **Standard JWT** doesn't support easy invalidation (logout) without a blocklist.
- **Standard Cookies** are shared across all tabs in a browser. If you log in as Admin in Tab 1, and User in Tab 2, both tabs will use the User cookie and the Admin tab will break.
- **Session Header** combines the best of both:
  - Tab independence (via `sessionStorage`)
  - Full server-side session control and easy logout (via `express-session` & MongoDB)
  - No changes needed to existing `req.session` based route handlers structure!
