'use strict';

const {
  applyProtectionHeaders,
  prepareChallenge,
  sendProtectionError
} = require('./_chat-protection');

module.exports = async function handler(req, res) {
  applyProtectionHeaders(res);

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const challenge = await prepareChallenge(req, res);
    res.status(200).json(challenge);
  } catch (error) {
    sendProtectionError(res, error);
  }
};
