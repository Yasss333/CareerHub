import { AccessToken } from 'livekit-server-sdk';

/**
 * Checks if LiveKit server credentials and URL are configured.
 */
export const isLiveKitConfigured = () => {
  if (process.env.ENABLE_LIVEKIT === 'false' || process.env.ENABLE_LIVEKIT === '0') {
    return false;
  }
  const apiKey = process.env.LIVEKIT_API_KEY || (process.env.NODE_ENV !== 'production' ? 'devkey' : null);
  const apiSecret = process.env.LIVEKIT_API_SECRET || (process.env.NODE_ENV !== 'production' ? 'secret' : null);
  const serverUrl = process.env.LIVEKIT_URL || (process.env.NODE_ENV !== 'production' ? 'ws://localhost:7880' : null);

  return Boolean(apiKey && apiSecret && serverUrl);
};

/**
 * Generates an authenticated LiveKit token for a video room.
 *
 * @param {Object} params
 * @param {string} params.roomName - Unique room identifier
 * @param {string} params.participantIdentity - User ID
 * @param {string} params.participantName - Display name
 * @param {boolean} [params.isMentor=false] - Whether the user is mentor/moderator
 * @returns {Promise<{ token: string, serverUrl: string, roomName: string }>}
 */
export const generateLiveKitToken = async ({
  roomName,
  participantIdentity,
  participantName,
  isMentor = false
}) => {
  const apiKey = process.env.LIVEKIT_API_KEY || (process.env.NODE_ENV !== 'production' ? 'devkey' : null);
  const apiSecret = process.env.LIVEKIT_API_SECRET || (process.env.NODE_ENV !== 'production' ? 'secret' : null);
  const serverUrl = process.env.LIVEKIT_PUBLIC_URL || process.env.LIVEKIT_URL || 'ws://localhost:7880';

  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit credentials are not configured on the server');
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: String(participantIdentity),
    name: participantName || 'CareerHub User',
    ttl: '3h'
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: Boolean(isMentor),
    roomRecord: false
  });

  const token = await at.toJwt();

  return {
    token,
    serverUrl,
    roomName,
    participantIdentity: String(participantIdentity),
    participantName: participantName || 'CareerHub User'
  };
};
