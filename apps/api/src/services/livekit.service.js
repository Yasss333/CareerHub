import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

const EMPTY_ROOM_GRACE_MS = 5 * 60 * 1000;
const MAX_CALL_DURATION_MS = 24 * 60 * 60 * 1000;
let roomServiceClient;

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

const liveKitCredentials = () => ({
  apiKey: process.env.LIVEKIT_API_KEY || (process.env.NODE_ENV !== 'production' ? 'devkey' : null),
  apiSecret: process.env.LIVEKIT_API_SECRET || (process.env.NODE_ENV !== 'production' ? 'secret' : null),
});

export const getLiveKitRoomService = () => {
  if (roomServiceClient) return roomServiceClient;
  const { apiKey, apiSecret } = liveKitCredentials();
  const websocketUrl = process.env.LIVEKIT_URL || (process.env.NODE_ENV !== 'production' ? 'ws://localhost:7880' : '');
  const apiUrl = websocketUrl.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
  if (!apiKey || !apiSecret || !apiUrl) throw new Error('LiveKit room service is not configured');
  roomServiceClient = new RoomServiceClient(apiUrl, apiKey, apiSecret);
  return roomServiceClient;
};

export const ensureLiveKitRoom = async (roomName) => getLiveKitRoomService().createRoom({
  name: roomName,
  emptyTimeout: 300,
  departureTimeout: 120,
  maxParticipants: 2,
});

export const listLiveKitParticipants = async (roomName) => getLiveKitRoomService().listParticipants(roomName);

export const getStaleCallReason = (callAgeMs, emptyAgeMs, participantCount) => {
  if (callAgeMs >= MAX_CALL_DURATION_MS) return 'maximum-duration';
  if (emptyAgeMs >= EMPTY_ROOM_GRACE_MS && participantCount === 0) return 'empty-room';
  return null;
};

export const cleanupStaleLiveSessions = async (prisma, now = new Date()) => {
  const liveKitAvailable = isLiveKitConfigured();

  const sessions = await prisma.sessionBooking.findMany({
    where: { status: 'started' },
    select: { id: true, juniorId: true, seniorId: true, updatedAt: true },
  });
  const roomService = liveKitAvailable ? getLiveKitRoomService() : null;
  let completed = 0;

  for (const session of sessions) {
    const emptyAgeMs = now.getTime() - new Date(session.updatedAt).getTime();
    const startedNotification = await prisma.notification.findFirst({
      where: {
        type: 'session_started',
        userId: { in: [session.juniorId, session.seniorId] },
        data: { path: ['sessionId'], equals: session.id },
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
    const callAgeMs = now.getTime() - new Date(startedNotification?.createdAt ?? session.updatedAt).getTime();
    if (callAgeMs < MAX_CALL_DURATION_MS && emptyAgeMs < EMPTY_ROOM_GRACE_MS) continue;
    const roomName = `careerhub-session-${session.id}`;
    let rooms = [];
    let participantCount = null;
    try {
      if (roomService) {
        rooms = await roomService.listRooms([roomName]);
        if (rooms.length) participantCount = (await roomService.listParticipants(roomName)).length;
        else participantCount = 0;
      }
    } catch (roomError) {
      console.warn(`LiveKit room check failed for session ${session.id}:`, roomError.message);
      if (callAgeMs < MAX_CALL_DURATION_MS) continue;
    }

    const reason = getStaleCallReason(callAgeMs, emptyAgeMs, participantCount);
    if (!reason) continue;

    try {
      const update = await prisma.sessionBooking.updateMany({
        where: { id: session.id, status: 'started', updatedAt: session.updatedAt },
        data: { status: 'completed' },
      });
      if (update.count !== 1) continue;

      if (rooms.length) {
        try {
          await roomService?.deleteRoom(roomName);
        } catch (roomError) {
          console.warn(`LiveKit room deletion failed for session ${session.id}:`, roomError.message);
        }
      }

      await prisma.notification.updateMany({
        where: {
          userId: { in: [session.juniorId, session.seniorId] },
          type: 'session_started',
          data: { path: ['sessionId'], equals: session.id },
          isRead: false,
        },
        data: { isRead: true },
      });

      const message = reason === 'maximum-duration'
        ? 'The meeting reached its maximum duration and was closed automatically.'
        : 'The meeting room was empty for five minutes and the session was closed automatically.';
      await prisma.notification.createMany({
        data: [session.juniorId, session.seniorId].map((userId) => ({
          userId,
          type: 'session_auto_ended',
          title: 'Meeting closed',
          message,
          data: { sessionId: session.id, reason },
        })),
      });
      completed += 1;
    } catch (error) {
      console.warn(`Live session cleanup failed for session ${session.id}:`, error.message);
    }
  }

  return { completed };
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
  const { apiKey, apiSecret } = liveKitCredentials();
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
