# 🤖 Discord to Roblox Chat Bridge Bot

A Discord bot that monitors a specific channel, displays message information with user details, and forwards messages to a Roblox chat server.

## ✨ Features

- **📡 Real-time Monitoring**: Watches Discord channel `1462305005376897289`
- **👤 User Information**: Shows username, display name, and avatar
- **🎮 Game Detection**: Displays what game/activity the user is currently in
- **🕐 Timezone Support**: Shows timestamps in viewer's timezone
- **💬 Message Forwarding**: Sends all chat messages to Roblox server
- **🎨 Rich Embeds**: Beautiful formatted message display in Discord
- **🏥 Health Monitoring**: Periodic checks of Roblox server status

## 📋 Requirements

- Node.js 18.0.0 or higher
- Discord Bot Token
- Discord Server with appropriate permissions

## 🚀 Quick Start

### 1. Clone or Download

Download all the files to your project directory.

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give it a name and create
4. Go to "Bot" section
5. Click "Add Bot"
6. Under "Privileged Gateway Intents", enable:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
   - ✅ Presence Intent
7. Copy your bot token

### 4. Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your bot token:

```env
DISCORD_TOKEN=your_actual_bot_token_here
```

### 5. Invite Bot to Server

1. Go to OAuth2 → URL Generator in Discord Developer Portal
2. Select scopes:
   - ✅ bot
   - ✅ applications.commands
3. Select bot permissions:
   - ✅ Read Messages/View Channels
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Read Message History
4. Copy the generated URL and open in browser
5. Select your server and authorize

### 6. Start the Bot

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

## 📁 Project Structure

```
discord-roblox-bridge/
├── discord-bot.js          # Main Discord bot file
├── server.js               # Roblox chat server (your existing file)
├── package.json            # Dependencies
├── .env                    # Configuration (create this)
├── .env.example            # Example configuration
└── README.md               # This file
```

## 🔧 Configuration

### Discord Bot Settings

Edit `discord-bot.js` to customize:

```javascript
const CONFIG = {
    MONITOR_CHANNEL_ID: '1462305005376897289',  // Channel to monitor
    ROBLOX_SERVER_URL: 'https://roblox-chat-server-z35g.onrender.com',
    STATUS_MESSAGE: '👀 Monitoring Chat',
    UPDATE_INTERVAL: 30000  // Health check interval (ms)
};
```

### Timezone Detection

By default, the bot uses `America/New_York` timezone. To customize:

1. **Per-User Timezone** (recommended):
   - Store user preferences in a database
   - Update `utils.detectTimezone()` function

2. **Global Timezone**:
   ```javascript
   detectTimezone() {
       return 'Europe/London';  // Change this
   }
   ```

Common timezones:
- `America/New_York` (EST/EDT)
- `America/Los_Angeles` (PST/PDT)
- `Europe/London` (GMT/BST)
- `Asia/Tokyo` (JST)
- `Australia/Sydney` (AEST/AEDT)

## 📊 Data Flow

```
Discord Message
    ↓
Bot Detects Message
    ↓
Extract User Info (username, display name, avatar)
    ↓
Get Game/Activity from Presence
    ↓
Format with Timezone
    ↓
    ├─→ Display Rich Embed in Discord
    └─→ Forward to Roblox Server (https://roblox-chat-server-z35g.onrender.com/send)
```

## 💬 Message Format

### Discord Display (Rich Embed)

```
┌─────────────────────────────────────┐
│ 👤 DisplayName                      │
├─────────────────────────────────────┤
│ 💬 Message content here             │
│                                     │
│ 👤 Username: user#1234              │
│ 🎮 Activity: Playing Fortnite       │
│ 🕐 Local Time: 03:45:23 PM          │
│                                     │
│ 🖼️ [Avatar Thumbnail]               │
│ Timezone: America/New_York          │
└─────────────────────────────────────┘
```

### Roblox Server Payload

```json
{
  "username": "[Discord] DisplayName",
  "message": "Message content",
  "game": "Playing Fortnite",
  "userId": "123456789012345678",
  "metadata": {
    "discordUsername": "user#1234",
    "timestamp": "03:45:23 PM",
    "timezone": "America/New_York",
    "avatarUrl": "https://cdn.discordapp.com/avatars/..."
  }
}
```

## 🎮 Activity/Game Detection

The bot detects various activity types:

- 🎮 **Playing**: Shows game name
- 🎥 **Streaming**: Shows "Streaming [Name]"
- 🎵 **Listening**: Shows "Listening to [Music]"
- 📺 **Watching**: Shows "Watching [Content]"
- 🏆 **Competing**: Shows "Competing in [Game]"
- 💬 **Custom Status**: Shows custom status text

## 🔍 Example Output

### Console Log
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📨 MESSAGE PROCESSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 User: JohnGamer (john123)
💬 Message: Hey everyone!
🎮 Game: Playing Minecraft
🕐 Time: 02:30:45 PM
🌍 Timezone: America/New_York
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Sent to Roblox: JohnGamer: Hey everyone!
```

## 🛠️ Troubleshooting

### Bot Not Responding
- Verify bot token in `.env`
- Check if bot has proper permissions
- Ensure Privileged Gateway Intents are enabled
- Check if you're messaging in the correct channel

### Messages Not Forwarding to Roblox
- Check Roblox server is running: `https://roblox-chat-server-z35g.onrender.com/health`
- Verify server URL in config
- Check console for error messages

### Avatar Not Showing
- Discord CDN may be slow
- User may not have custom avatar (will show default)

### Wrong Timezone
- Update `detectTimezone()` function
- Consider implementing per-user timezone storage

## 📝 API Endpoints (Roblox Server)

The bot sends data to these endpoints:

- `POST /send` - Send new message
- `GET /health` - Check server status
- `GET /messages` - Retrieve messages
- `GET /stats` - Server statistics

## 🔐 Security Notes

- Never commit `.env` file to version control
- Keep your Discord bot token secret
- Use environment variables for sensitive data
- Regularly rotate your bot token

## 📦 Dependencies

- `discord.js` - Discord API wrapper
- `axios` - HTTP client for Roblox server
- `express` - Web server for Roblox chat
- `cors` - CORS middleware
- `dotenv` - Environment variable management

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License - feel free to use and modify as needed.

## 🆘 Support

If you encounter issues:
1. Check the console output for errors
2. Verify all configuration settings
3. Ensure Discord bot has proper permissions
4. Check Roblox server is accessible

## 🎯 Roadmap

- [ ] Per-user timezone preferences
- [ ] Database integration for message history
- [ ] Command system for bot control
- [ ] Message filtering options
- [ ] Rate limiting protection
- [ ] Multi-channel monitoring
- [ ] Custom embed colors per user
- [ ] Reaction-based commands

---

Made with ❤️ for Discord and Roblox integration
