const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 8080;

// Create WebSocket server
const wss = new WebSocket.Server({ port: PORT });

// Store active meetings and their participants
// Structure: { meetingId: { participantId: WebSocket } }
const meetings = new Map();

console.log(`🚀 Custom Emoji Relay Server running on port ${PORT}`);

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  let currentMeetingId = null;

  console.log(`✅ New client connected: ${clientId}`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    clientId: clientId,
    message: 'Connected to emoji relay server'
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`📨 Received from ${clientId}:`, data);

      switch (data.type) {
        case 'join':
          handleJoin(ws, clientId, data.meetingId);
          currentMeetingId = data.meetingId;
          break;

        case 'reaction':
          handleReaction(clientId, currentMeetingId, data);
          break;

        case 'leave':
          handleLeave(clientId, currentMeetingId);
          currentMeetingId = null;
          break;

        default:
          console.log(`⚠️ Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`👋 Client disconnected: ${clientId}`);
    if (currentMeetingId) {
      handleLeave(clientId, currentMeetingId);
    }
  });

  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for ${clientId}:`, error);
  });
});

// Handle client joining a meeting
function handleJoin(ws, clientId, meetingId) {
  console.log(`🎯 Client ${clientId} joining meeting: ${meetingId}`);

  // Create meeting room if it doesn't exist
  if (!meetings.has(meetingId)) {
    meetings.set(meetingId, new Map());
    console.log(`📝 Created new meeting room: ${meetingId}`);
  }

  // Add client to meeting
  const meeting = meetings.get(meetingId);
  meeting.set(clientId, ws);

  // Notify client of successful join
  ws.send(JSON.stringify({
    type: 'joined',
    meetingId: meetingId,
    participantCount: meeting.size
  }));

  // Notify other participants
  broadcastToMeeting(meetingId, {
    type: 'participant-joined',
    participantCount: meeting.size
  }, clientId);

  console.log(`✅ Meeting ${meetingId} now has ${meeting.size} participants`);
}

// Handle emoji reaction broadcast
function handleReaction(clientId, meetingId, data) {
  if (!meetingId) {
    console.log(`⚠️ Client ${clientId} not in a meeting`);
    return;
  }

  console.log(`🎉 Broadcasting reaction from ${clientId} in meeting ${meetingId}`);

  // Broadcast to all participants in the meeting
  broadcastToMeeting(meetingId, {
    type: 'reaction',
    emoji: data.emoji,
    fromClientId: clientId,
    timestamp: Date.now()
  });
}

// Handle client leaving a meeting
function handleLeave(clientId, meetingId) {
  if (!meetingId || !meetings.has(meetingId)) {
    return;
  }

  const meeting = meetings.get(meetingId);
  meeting.delete(clientId);

  console.log(`👋 Client ${clientId} left meeting ${meetingId}`);

  // Clean up empty meetings
  if (meeting.size === 0) {
    meetings.delete(meetingId);
    console.log(`🗑️ Deleted empty meeting room: ${meetingId}`);
  } else {
    // Notify remaining participants
    broadcastToMeeting(meetingId, {
      type: 'participant-left',
      participantCount: meeting.size
    });
  }
}

// Broadcast message to all participants in a meeting
function broadcastToMeeting(meetingId, message, excludeClientId = null) {
  if (!meetings.has(meetingId)) {
    return;
  }

  const meeting = meetings.get(meetingId);
  const messageStr = JSON.stringify(message);
  let sentCount = 0;

  meeting.forEach((ws, clientId) => {
    if (clientId !== excludeClientId && ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
      sentCount++;
    }
  });

  console.log(`📡 Broadcasted to ${sentCount} participants in meeting ${meetingId}`);
}

// Health check endpoint
wss.on('listening', () => {
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('  Custom Emoji Relay Server Ready!');
  console.log(`  WebSocket: ws://localhost:${PORT}`);
  console.log('═══════════════════════════════════════');
  console.log('');
});

// Periodic cleanup of stale connections
setInterval(() => {
  let totalParticipants = 0;
  meetings.forEach((meeting, meetingId) => {
    totalParticipants += meeting.size;
  });

  if (meetings.size > 0) {
    console.log(`📊 Active meetings: ${meetings.size}, Total participants: ${totalParticipants}`);
  }
}, 60000); // Every minute
