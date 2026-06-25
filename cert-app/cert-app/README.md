# HonorHub by Zequence — trial deploy

Recognise. Celebrate. Inspire.

HonorHub is a privacy-first certificate and recognition prototype for schools, churches,
football clubs, charities, companies, training providers, and events. Recipient uploads
are session-only by default; organisation branding and settings can be saved.

```
cert-app/
├─ index.html        the whole tool: dashboard, wizard, templates, CSV, preview, print
├─ package.json      minimal Vercel project metadata and checks
├─ api/reasons.js    serverless proxy for the AI button; needs ANTHROPIC_API_KEY
├─ api/platform.js   HonorHub platform config for the prototype UI
├─ api/session-complete.js
│                    anonymous session close confirmation; stores no recipient data
├─ scripts/check-html.js
└─ README.md
```

Everything except the AI button is pure static HTML, so it works the moment it is deployed.
The AI button uses the serverless function so the API key stays on the server.

## MVP Modules

- Dashboard
- Certificates
- Templates
- Organisations
- Users
- Branding
- Signatories
- Recipients
- AI Writer
- Print & PDF
- Settings

## Product Direction

Position this as **HonorHub by Zequence**, not just a certificate generator.

Core messages:

- Recognise. Celebrate. Inspire.
- Recognition made simple.
- No recipient records stored by default.

Version 1 should store organisation settings, user accounts, branding, logos, signatures,
colours, templates, award categories, and billing settings.

By default, it should not permanently store recipient names, certificate history, award
history, or recognition timelines. Users upload a CSV or enter recipients manually,
generate certificates, print or download, then clear the session.

See `../../docs/product-architecture.md` for the multi-tenant architecture and roadmap.

## Backend Endpoints

- `GET /api/platform`: returns HonorHub modules, tenant model, categories, and privacy posture.
- `POST /api/session-complete`: confirms a session has closed without storing recipient names.
- `POST /api/reasons`: rewrites achievement notes with AI; requires `ANTHROPIC_API_KEY`.

## Deploy to Vercel

1. Import the GitHub repo into Vercel or run `vercel --prod` from this folder.
2. Add `ANTHROPIC_API_KEY` in Vercel project settings for the live AI Writer.
3. Deploy. The core app works even before the AI key is set.

## Privacy by Design

- Recipient names are never sent to the AI workflow.
- The AI step sends only achievement notes; names are merged into certificates locally.
- Organisation settings are saved locally in the browser for this prototype.
- Recipient rows are not saved to local storage and can be cleared with **Clear recipients**.
- Production recipient sessions should be short-lived and deleted after export or expiry.
- Recognition Timeline, saved contacts, award history, and QR verification should remain opt-in because they store recipient records.

For schools, charities, churches, and companies, review the controller/processor position
and sub-processors before launch. This is product guidance, not legal advice.
