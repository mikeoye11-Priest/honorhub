const platform = {
  product: 'HonorHub',
  company: 'Zequence',
  tagline: 'Recognise. Celebrate. Inspire.',
  privacyMode: 'session-only-recipients',
  message: 'Recognition made simple. No recipient records stored by default.',
  modules: [
    'Dashboard',
    'Certificates',
    'Templates',
    'Organisations',
    'Users',
    'Branding',
    'Signatories',
    'Recipients',
    'AI Writer',
    'Print & PDF',
    'Settings'
  ],
  tenantModel: {
    account: 'Zequence Digital',
    organisationTypes: [
      'Schools',
      'Churches',
      'Charities',
      'Companies',
      'Football Clubs',
      'Sports Clubs',
      'Youth Clubs',
      'Training Providers',
      'Events',
      'Communities'
    ],
    organisations: [
      {
        id: 'org_oakfield_primary',
        type: 'School',
        name: 'Oakfield Primary School',
        roles: ['Headteacher', 'Admin', 'Teachers', 'SENCO']
      },
      {
        id: 'org_grace_church',
        type: 'Church',
        name: 'Grace Community Church',
        roles: ['Pastor', 'Administrator', 'Volunteer Coordinator']
      },
      {
        id: 'org_oakfield_fc',
        type: 'Football Club',
        name: 'Oakfield Juniors FC',
        roles: ['Coach', 'Manager', 'Administrator']
      }
    ]
  },
  storedByDefault: [
    'organisation account',
    'user accounts',
    'organisation logo',
    'brand colours',
    'favourite certificate templates',
    'signatories',
    'default footer',
    'award categories',
    'billing settings'
  ],
  notStoredByDefault: [
    'recipient names',
    'certificate history',
    'award history',
    'recognition timeline'
  ],
  categorySets: {
    school: ['Weekly Awards', 'Reading', 'Attendance', 'Behaviour', 'Sports Day', 'Graduation', 'Teacher Awards'],
    football: ['Player of Match', 'Golden Boot', 'Respect Award', 'Parents Player', 'Season Awards', 'Tournament Winners', 'Academy Graduation'],
    church: ['Membership', 'Baptism', 'Workers Training', 'Volunteer', 'Conference', 'Bible School', 'Appreciation'],
    company: ['Employee of Month', 'Training', 'Long Service', 'Innovation', 'Safety', 'Leadership', 'Recognition']
  },
  futureModules: [
    'Recognition Timeline',
    'Digital Badges',
    'Achievement Wall',
    'Event Awards',
    'Hall of Fame',
    'Mobile App',
    'Marketplace',
    'Saved Contacts',
    'QR Verification',
    'Email Delivery'
  ],
  aiGuardrail: 'AI receives achievement notes only. Recipient names are merged locally in the browser.'
};

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('cache-control', 's-maxage=300, stale-while-revalidate=600');
  return res.status(200).json(platform);
}
