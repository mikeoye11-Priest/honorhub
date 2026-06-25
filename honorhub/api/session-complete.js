export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const certificateCount = Number(body.certificateCount || 0);
  const organisationId = typeof body.organisationId === 'string'
    ? body.organisationId.slice(0, 80)
    : typeof body.schoolId === 'string'
      ? body.schoolId.slice(0, 80)
      : 'prototype';

  if (!Number.isFinite(certificateCount) || certificateCount < 0 || certificateCount > 1000) {
    return res.status(400).json({ error: 'Invalid certificate count' });
  }

  return res.status(200).json({
    ok: true,
    organisationId,
    certificateCount,
    recipientDataStored: false,
    pupilDataStored: false,
    deleted: true,
    message: 'Session closed. No recipient names or award rows were stored by this endpoint.'
  });
}
