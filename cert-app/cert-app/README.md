# School Recognition Platform — trial deploy

A privacy-first certificate and recognition prototype for UK schools, plus one serverless
function that lets the "Write reasons with AI" button work safely (the API key stays on
the server).

```
cert-app/
├─ index.html        the whole tool (templates, CSV import, branding, print)
├─ package.json      minimal Vercel project metadata and checks
├─ api/reasons.js    serverless proxy for the AI button — needs ANTHROPIC_API_KEY
├─ api/platform.js   privacy-first platform config for the prototype UI
├─ api/session-complete.js
│                    anonymous session close confirmation; stores no pupil data
├─ scripts/check-html.js
└─ README.md
```

Everything except the AI button is pure static HTML, so it works the moment it's deployed.
The AI button only needs the function below.

## Product direction

Position this as a **School Recognition Platform**, not just a certificate generator.
Version 1 should store school/trust settings, teacher accounts, branding, logos,
signatures, colours, templates, and award categories.

By default, it should not permanently store pupil names, certificate history, or award
history. Teachers upload a weekly CSV, generate certificates, print or download, then
clear the session.

Production tenant model:

- A trust owns one or more schools.
- Each school has its own logo, name, colours, signatures, templates, and teacher accounts.
- Headteachers, admins, teachers, SENCOs, and trust leaders get access through memberships.
- No school can access another school's records.

Marketing line:

> Designed with privacy first. No pupil records stored by default.

See `../../docs/product-architecture.md` for the multi-tenant architecture and roadmap.

## Deploy to Vercel — option A: GitHub (recommended)

1. Open this folder in VS Code.
2. Create a repo and push it (VS Code: Source Control → "Publish to GitHub").
3. Go to vercel.com → Add New… → Project → import the repo.
4. Before deploying, open **Settings → Environment Variables** and add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your key from console.anthropic.com
5. Deploy. You get a URL like `your-app.vercel.app` to send to teachers.

Future edits: push to GitHub and Vercel redeploys automatically.

## Deploy to Vercel — option B: CLI (fastest)

```bash
npm i -g vercel
cd cert-app
vercel                       # follow the prompts to create the project
vercel env add ANTHROPIC_API_KEY   # paste your key when asked (Production)
vercel --prod                # deploy the live version
```

## Notes

- No dependencies and no build step — the function uses Node's built-in fetch (Node 18+).
- Cost is tiny: one click ≈ one short request. A class of 30 names is well under a penny.
- The endpoint is public. Before sharing the link widely, add a basic guard so nobody
  can run up your key — the simplest is Vercel's **Deployment Protection** (password) under
  project Settings. For a real product you'd also move the prompt server-side and rate-limit.
- To change the wording the AI produces, edit the `prompt` text inside `index.html`
  (in the `writeReasons` function). To change the model, edit `api/reasons.js`.

## Privacy by design

- Pupil names are never sent anywhere by the AI workflow. The AI step sends only the
  teacher's notes; the names are merged into the certificate locally in the browser.
- School settings are saved locally in the browser for this prototype. Pupil rows are
  not saved to local storage and can be cleared with **Clear pupils**.
- In the production product, pupil CSV uploads should be treated as session-only
  processing unless a school explicitly opts into a student database or award history.
- The AI feature sends only achievement notes for rewriting. Pupil names stay on the
  page and are merged back into the certificates locally.
- For pupil data the school/trust is the controller and you are the processor, so you'll
  need a short data processing agreement (DPA) with each school or trust before launch.
  Anthropic acts as a sub-processor for the notes and should be listed as such.
  (Not legal advice — have a DPO or solicitor review before you go live.)
