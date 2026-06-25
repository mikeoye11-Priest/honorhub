const platform = {
  product: 'School Recognition Platform',
  privacyMode: 'session-only-pupils',
  message: 'Designed with privacy first. No pupil records stored by default.',
  tenantModel: {
    trust: 'Oakfield Learning Trust',
    schools: [
      {
        id: 'school_oakfield',
        name: 'Oakfield Primary School',
        roles: ['Headteacher', 'Admin', 'Year 1 Teachers', 'Year 2 Teachers', 'SENCO']
      },
      {
        id: 'school_brook_lane',
        name: 'Brook Lane School',
        roles: ['Headteacher', 'Admin', 'Teachers', 'SENCO']
      },
      {
        id: 'school_hilltop',
        name: 'Hilltop Academy',
        roles: ['Headteacher', 'Admin', 'Teachers', 'SENCO']
      }
    ]
  },
  storedByDefault: [
    'trust account',
    'school account',
    'teacher accounts',
    'school logo',
    'school branding',
    'favourite certificate templates',
    'signatures',
    'school colours',
    'award categories'
  ],
  notStoredByDefault: [
    'pupil names',
    'certificate history',
    'award history'
  ],
  futureModules: [
    'student database',
    'award history',
    'analytics',
    'trust dashboard',
    'sports day certificates',
    'attendance certificates',
    'reading awards',
    'house points',
    'behaviour rewards',
    'graduation certificates',
    'nursery certificates',
    'EYFS learning journeys',
    'staff appreciation certificates',
    'governor appreciation certificates'
  ],
  aiGuardrail: 'AI receives achievement notes only. Pupil names are merged locally in the browser.'
};

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('cache-control', 's-maxage=300, stale-while-revalidate=600');
  return res.status(200).json(platform);
}
