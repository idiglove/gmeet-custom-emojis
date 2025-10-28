# Custom Emoji Relay Server

WebSocket relay server that broadcasts custom emoji reactions to all participants in a Google Meet call.

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Start the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

The server will start on **port 8080** by default.

You should see:
```
═══════════════════════════════════════
  Custom Emoji Relay Server Ready!
  WebSocket: ws://localhost:8080
═══════════════════════════════════════
```

## How It Works

1. **Extension Connects**: When users join a Google Meet, the extension connects to the relay server via WebSocket
2. **Meeting Rooms**: The server creates virtual "rooms" based on the Meet URL (e.g., `abc-defg-hij`)
3. **Broadcast Reactions**: When a user clicks a custom emoji, it's sent to the server
4. **Relay to All**: Server broadcasts the reaction to all participants in the same meeting room
5. **Display**: Each participant's extension displays the reaction animation

## API

### Client → Server Messages

#### Join Meeting
```json
{
  "type": "join",
  "meetingId": "abc-defg-hij"
}
```

#### Send Reaction
```json
{
  "type": "reaction",
  "emoji": {
    "emoji": "🔥",
    "shortcode": ":fire:",
    "isImage": false
  }
}
```

#### Leave Meeting
```json
{
  "type": "leave"
}
```

### Server → Client Messages

#### Connected
```json
{
  "type": "connected",
  "clientId": "uuid-here",
  "message": "Connected to emoji relay server"
}
```

#### Joined Room
```json
{
  "type": "joined",
  "meetingId": "abc-defg-hij",
  "participantCount": 3
}
```

#### Reaction Received
```json
{
  "type": "reaction",
  "emoji": {
    "emoji": "🔥",
    "shortcode": ":fire:",
    "isImage": false
  },
  "fromClientId": "uuid-here",
  "timestamp": 1234567890
}
```

#### Participant Events
```json
{
  "type": "participant-joined",
  "participantCount": 4
}
```

```json
{
  "type": "participant-left",
  "participantCount": 3
}
```

## Production Deployment

For production use, consider:

1. **Use a real server**: Deploy to a cloud service (Heroku, AWS, DigitalOcean, etc.)
2. **Use WSS**: Enable SSL/TLS for secure WebSocket connections (wss://)
3. **Environment variables**: Configure port and other settings via env vars
4. **Authentication**: Add authentication to prevent unauthorized access
5. **Rate limiting**: Prevent spam/abuse
6. **Monitoring**: Add logging and monitoring tools

### Example: Deploy to Heroku

```bash
# In the server directory
heroku create my-emoji-relay
git init
git add .
git commit -m "Initial commit"
git push heroku master
```

Then update `content.js`:
```javascript
const RELAY_SERVER_URL = 'wss://my-emoji-relay.herokuapp.com';
```

## Troubleshooting

**Connection refused**: Make sure the server is running on port 8080

**No reactions showing**: Check browser console for WebSocket connection errors

**Server crashes**: Check server logs for errors, ensure Node.js version is 16+

## Requirements

- Node.js 16 or higher
- npm or yarn

## License

MIT
