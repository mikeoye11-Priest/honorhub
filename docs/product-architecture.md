# School Recognition Platform

## Positioning

This product should be positioned as a privacy-first school recognition platform, not only a certificate generator.

Core message:

> Designed with privacy first. No pupil records stored by default.

Certificates are the first workflow. The broader platform can later cover awards, house points, attendance recognition, sports day, graduation, staff appreciation, trust reporting, and parent sharing.

## Version 1 Scope

Version 1 stores school and trust configuration, but treats weekly pupil uploads as session data.

Store:

- Trust account
- School account
- Teacher and admin accounts
- School name
- School logo
- School colours
- Signatures
- Favourite certificate templates
- Award categories

Do not store by default:

- Pupil names
- Certificate history
- Award history

Teacher workflow:

1. Log in.
2. Choose certificate type.
3. Upload a weekly CSV.
4. Generate certificates.
5. Preview.
6. Print or download PDFs.
7. Clear/delete the CSV and pupil data from the session.

The current static prototype follows the same rule: school settings can be saved in the browser, while pupil rows are kept only in the live page session and can be cleared with the "Clear pupils" control.

## Multi-Tenant Model

Recommended hierarchy:

```text
Trust
  School A
    Headteacher
    Admin
    Year 1 Teachers
    Year 2 Teachers
    SENCO
  School B
  School C
```

Every school gets its own logo, school name, colours, signatures, certificate templates, award categories, and teacher accounts.

Recommended production tables:

- `trusts`
- `schools`
- `memberships`
- `teacher_profiles`
- `school_branding`
- `certificate_templates`
- `signatures`
- `award_categories`
- `csv_import_sessions`

Every database table that belongs to a tenant should include `trust_id` and, where relevant, `school_id`. Session import rows should be short-lived and deleted automatically after PDF generation or session expiry.

Access rules:

- Trust users can view trust-wide settings and reporting for schools in their trust.
- School users can view only their school data.
- Teachers can create certificates for their assigned school.
- No user can query another school or trust without an explicit membership.
- Row-level security should enforce the same boundary in the database, not only in application code.

## Teacher Workflow

The core workflow should stay very simple:

1. Login.
2. Choose certificate type.
3. Upload CSV.
4. Generate certificates.
5. Preview.
6. Print or download PDF.
7. CSV and pupil session data are automatically deleted.

This is the strongest Version 1 privacy selling point.

## Future Opt-In Modules

Student database:

- Pupil name
- Class
- Year group
- House
- Attendance

Award history:

- Pupil
- Award type
- Certificate template
- Teacher
- Date awarded
- Optional reason text

Analytics:

- Awards this term by year group
- House totals
- Most common awards
- Active teachers
- Active schools
- Popular templates

Trust dashboard:

- 12 schools
- Awards this week
- 430 certificates
- 67 teachers active
- 12 schools active
- Most popular templates
- Top awards

Recognition modules:

- Sports Day certificates
- Attendance certificates
- Reading awards
- House points
- Behaviour rewards
- Graduation certificates
- Nursery certificates
- EYFS learning journeys
- Staff appreciation certificates
- Governor appreciation certificates

These modules should be opt-in because they change the privacy posture from session-only processing to stored pupil records.

## Suggested Stack

- Frontend: React and TypeScript
- Backend: FastAPI
- Database: PostgreSQL
- Authentication: Supabase Auth
- File storage: Supabase Storage for logos and signatures
- PDF generation: server-side Playwright for reliable school-ready PDFs
- Hosting: Vercel for frontend, Render or Fly.io for backend

## Subscription Model

Avoid per-certificate pricing. Schools prefer predictable monthly cost and unlimited certificate generation.

| Plan | Price |
| --- | ---: |
| Teacher | £4.99/month |
| Small School | £19/month |
| Primary School | £39/month |
| Large School | £59/month |
| MAT up to 10 schools | £199/month |
| Enterprise Trust | Custom |

## AI Wording

AI should help teachers turn short notes into polished certificate wording.

Examples:

- "Helped another child" becomes "for consistently showing kindness and supporting classmates throughout the week."
- "Worked hard in maths" becomes "for demonstrating perseverance and growing confidence in mathematics."

Privacy guardrail:

- Send notes only, not pupil names. In the current prototype, pupil names stay in the browser and only the achievement notes are sent to the serverless AI endpoint.
- If schools require stricter controls later, support a tenant-hosted or approved AI gateway where even the notes stay inside the school's chosen infrastructure.
- Keep prompts achievement-focused.
- Do not store AI prompts containing pupil data unless a school explicitly opts into stored history.
