# Security

## Design

- **Static site, no backend.** Themes, bets, decisions and sign-offs live only in the viewer's browser (`localStorage`).
- **Content-Security-Policy.** Scripts load only from this site. Network access is limited to `api.anthropic.com`, for the optional live discovery run.
- **Output encoding.** All dynamic text, including feedback, model output and imported backups, is HTML-escaped before rendering.
- **Secrets.** The Anthropic key is held in `sessionStorage` for the current tab only.
- **Model calls.** Emails and phone numbers are redacted before sending. Feedback is wrapped as untrusted data, and tags inside it are neutralised. The model has no tools and returns a strict JSON schema that is re-validated locally, including a check that every cited piece of evidence exists.
- **Backups.** A restore is refused unless the file has the expected shape and its audit chain verifies.

In production, route model calls through a server-side gateway that holds the key and applies organisation policy (logging, data-loss prevention, model allow-list). The browser call exists only so a public demo needs no backend.

## Reporting a vulnerability

Please open a private security advisory on this repository (Security → Advisories → Report a vulnerability) rather than a public issue.
