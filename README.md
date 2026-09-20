# Humanity³ — The Codex

Landing page for **"The Codex" / Humanity Basic Infrastructure Project** — a codex of
human know-how as a public resource, plus the open-source software to coordinate human
activity around it. Basic infrastructure for human flourishing. Free & open source.

> "Building tools for the well-intended." This is how we coordinate as a superorganism.

## Live
- Primary: https://humanity3.earth
- Alt (redirect): https://humanityinfrastructure.com

## Sources
- Master doc (Google Docs): https://docs.google.com/document/d/1-dxQdUBJ50f7qMO3lTemHEYcT7XUe4pOTgetf_KcMk0/edit
- Healing "Cody Codex" (Notion): https://plausible-text-76b.notion.site/Cody-s-Healing-List-v4-b05b097d529c4c54b5d62f87f55b1f6f

## Stack
Static `index.html` plus checked-in JSON data (no dependency build step). Hosted on
GitHub Pages, DNS via Cloudflare. Dark/light theme toggle, version shown in footer.

## Humanity Infrastructure Tracker
The public "People building humanity infrastructure" section renders from
`data/humanity-infrastructure.json`.

Required metadata fields:
- `publicLabel`, `lastVerified`, `siteVersion`, `siteLastUpdated`,
  `siteLastUpdatedLabel`
- at least one `sourceThread` link
- at least three `verificationRules`

Required fields for public project entries:
- `id`, `name`, `status`, `verification`, `focusArea`, `replacesOrEnables`
- at least one `officialLinks` item
- at least one `evidence` item from a primary source
- at least one `people` or maintainer-organization role
- `lastVerified` as `YYYY-MM-DD`

Pending leads use the same fields as public project entries, but must live in
`leads`, use `verification: "verification pending"`, and include `pendingReason`.

Signal sources live in `signals` instead of `projects` or `leads`. Required signal
fields are `id`, `name`, `role: "signal source"`, `signalFor`, `links`,
`lastVerified`, and `note`.

Verification rules:
- Use official repositories, project sites, or original public posts before naming a
  builder or maintainer.
- Keep builders/maintainers separate from signal sources and commentators.
- If a project exists but the thread-to-project mapping is not proved, keep it in
  `leads` with `verification: "verification pending"`.
- Do not add related projects such as OpenWhispr or Muesli unless primary-source
  evidence ties the specific project to this initial set.

To update the tracker, edit `data/humanity-infrastructure.json`, update
`meta.lastVerified`, `meta.siteVersion`, and `meta.siteLastUpdated*` when the public
page changes, then run:

```bash
node scripts/validate-infrastructure-data.mjs
```

The same validator is also available through `npm test` or `npm run validate:data`.

Archive a project by setting `status` to `archived` and leaving the original evidence
intact. Remove entries only when the original source was wrong or unsafe to publish.

## Deploy
Push to `main`; GitHub Pages serves the root. `CNAME` pins the custom domain.
