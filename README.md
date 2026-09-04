# .github — the hub

Org-wide pieces. Nothing client-facing lives here.

- `.github/workflows/announce.yml` — the reusable announcement. Repos call it; they never copy it.
- `workflow-templates/` — the two-file starter a repo drops in to join.
- `scripts/announce.mjs` — writes the line. Claude when a key exists, a house line otherwise. Never blocks a push.
- `profile/README.md` — the org front page.

## Secrets the org expects (Settings → Secrets → Actions, org level)

| Secret | Used for | Without it |
|---|---|---|
| `ANTHROPIC_API_KEY` | the funny line | a house line is used instead |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | sending from the bot mailbox (Gmail app password) | email step is skipped, comment still posts |
| `TEAM_EMAILS` | comma-separated recipients | email step is skipped |

Nothing here can merge, deploy, or touch a client account. The workflow has read access to code and write access to comments, and that is all.
