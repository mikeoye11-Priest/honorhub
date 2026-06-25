# HonorHub by Zequence

Tagline:

> Recognise. Celebrate. Inspire.

Alternative:

> Recognition made simple.

HonorHub should be positioned as a privacy-first recognition management platform. Certificates are the first workflow, but the long-term product is a hub for organisations to recognise achievement, celebrate milestones, manage branded awards, and optionally keep a recognition timeline.

## Version 1 MVP

Launch with these modules:

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

Version 1 stores organisation setup and branding, but treats recipient uploads as session data unless the organisation opts into saved contacts or recognition timelines.

Store by default:

- Organisation account
- User accounts
- Logo
- Primary and secondary colours
- Favourite templates
- Signatories
- Digital signatures
- Default footer
- Award categories
- Billing settings

Do not store by default:

- Recipient names
- Certificate history
- Award history
- Recognition timeline

## Dashboard

The first screen should feel operational, not like a landing page.

Example:

```text
HonorHub

Good morning Michael

Certificates Created   1,240
This Month             186
Templates              14
Users                  8

Recent Activity
- Football Awards
- Volunteer Certificates
- Staff Recognition

Quick Actions
+ Create Certificate
+ Upload CSV
+ Browse Templates
+ Manage Branding
```

## Create Certificate Wizard

Step 1 asks:

Who are you recognising?

- School
- Football Club
- Sports Club
- Church
- Charity
- Company
- Training Provider
- Event
- Other

The selected sector should change categories, defaults, AI tone, template recommendations, signatory labels, and dashboard language.

## Certificate Categories

School:

- Weekly Awards
- Reading
- Attendance
- Behaviour
- Sports Day
- Graduation
- Teacher Awards

Football Club:

- Player of Match
- Golden Boot
- Respect Award
- Parents Player
- Season Awards
- Tournament Winners
- Academy Graduation

Church:

- Membership
- Baptism
- Workers Training
- Volunteer
- Conference
- Bible School
- Appreciation

Company:

- Employee of Month
- Training
- Long Service
- Innovation
- Safety
- Leadership
- Recognition

## Templates

The template library should be visual and sector-aware.

Template groups:

- Classic
- Modern
- Gold
- Premium
- Children
- Corporate
- Sports
- Church
- Luxury

Flow:

1. Choose template.
2. Preview.
3. Generate.
4. Print, download, email, or share.

## Branding

Every organisation configures branding once.

- Organisation logo
- Primary colour
- Secondary colour
- Font
- Watermark
- Background
- Default signatory
- Default footer
- QR verification
- Certificate number format

## Signatories

Common signatory roles:

- Headteacher
- Pastor
- Chairman
- CEO
- Director
- Coach
- Manager
- Administrator

Each signatory can include:

- Name
- Position
- Digital signature
- Photo

## Recipient Import

Version 1 supports:

- Upload CSV
- Manual entry

Future:

- Saved contacts
- Organisation directories
- Team/class/group lists

## AI Recognition Writer

AI must receive recognition notes only. Recipient names should stay in the browser and be merged locally into certificate previews and PDFs.

Examples:

- Teacher enters: "Worked hard in Maths"
- AI writes: "For demonstrating perseverance and confidence throughout Mathematics this week."

- Coach enters: "Scored twice"
- AI writes: "For outstanding determination and teamwork, scoring two excellent goals."

- Church user enters: "Served faithfully"
- AI writes: "For faithful and dedicated service in advancing the work of the ministry."

Different sectors should use different AI tones.

## Preview Screen

The preview screen should feel closer to Canva than a form.

Left:

- Recipients
- Previous/next navigation

Middle:

- Large certificate preview

Right:

- Change template
- Change colours
- Edit text
- AI improve
- Logo
- Signature
- Export

Export options:

- Print
- Download PDF
- One PDF
- Separate PDFs
- Email
- Share

## QR Verification

Optional certificate verification can make HonorHub stronger for businesses, training providers, events, and sports clubs.

Every verified certificate can receive a number:

```text
HH-2026-0000124
```

Scan result:

- Verified
- Issued by HonorHub
- Issued for the organisation
- Date
- Recipient
- Award

## Multi-Tenant SaaS Architecture

Top-level model:

```text
HonorHub
  Schools
  Churches
  Charities
  Companies
  Football Clubs
  Sports Clubs
  Youth Clubs
  Training Providers
  Events
  Communities
```

Each organisation has:

- Users
- Brand
- Templates
- Signatures
- Settings
- Billing
- Reports

Recommended production tables:

- `accounts`
- `organisations`
- `organisation_memberships`
- `users`
- `branding_profiles`
- `certificate_templates`
- `template_favourites`
- `signatories`
- `award_categories`
- `recipient_sessions`
- `certificate_exports`
- `subscriptions`
- `audit_events`

Every organisation-owned table should include `account_id` and `organisation_id`. Row-level security should enforce organisation boundaries in the database, not only in application code.

Session recipient data should be deleted after export or session expiry unless the organisation has opted into saved recipients or recognition timelines.

## Reporting

Reports can include:

- Certificates this month
- By user
- By template
- By category
- By department
- By team
- By school
- By organisation

Notifications:

- PDF ready
- Certificate sent
- Logo updated
- User added
- Subscription status

## Marketplace

Future template packs could become an additional revenue stream.

Marketplace packs:

- Sports templates
- Christmas
- Graduation
- Conference
- Easter
- Harvest
- Corporate
- Football
- Volunteer

## Future Modules

- Digital Badges
- Achievement Wall
- Event Awards
- Hall of Fame
- Mobile App
- Saved Contacts
- QR Verification
- Email Delivery
- Marketplace

## Recognition Timeline

The feature to add later is a Recognition Timeline for organisations that choose to store recipients.

Instead of only generating certificates, HonorHub becomes a record of achievement.

Examples:

- A football coach can see Player of the Match, Respect Award, and Most Improved Player history for a player.
- A school can see reading, attendance, and achievement awards over the year.
- A company can track employee recognition and training certificates.
- A church can record ministry training and volunteer appreciation.

This must remain opt-in because it changes the privacy posture from session-only processing to stored recipient records.

## Suggested Stack

- Frontend: React and TypeScript
- Backend: FastAPI or Vercel serverless for early MVP
- Database: PostgreSQL
- Authentication: Supabase Auth
- Storage: Supabase Storage for logos and signatures
- PDF generation: server-side Playwright for reliable PDFs
- Hosting: Vercel for frontend, Render or Fly.io for API

## Subscription Model

Avoid per-certificate pricing. Organisations prefer predictable monthly cost and unlimited certificate generation.

Potential plans:

- Individual
- Small Organisation
- School/Club
- Company
- Multi-Organisation
- Enterprise
