# 🚀 QUICK START GUIDE

## 5-Minute Setup

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Run Setup Wizard
```bash
npm run setup
```
Follow the prompts to configure your bot.

### 3️⃣ Create Discord Bot

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Go to "Bot" section → "Add Bot"
4. **Enable these Privileged Gateway Intents:**
   - ✅ Server Members Intent
   - ✅ Message Content Intent  
   - ✅ Presence Intent
5. Copy your bot token (use in setup wizard)

### 4️⃣ Invite Bot to Server

1. Go to OAuth2 → URL Generator
2. Select scopes: `bot`, `applications.commands`
3. Select permissions:
   - Read Messages/View Channels
   - Send Messages
   - Embed Links
   - Read Message History
4. Copy URL and authorize in your server

### 5️⃣ Start the Bot
```bash
npm start
```

## ✅ You're Done!

The bot will now:
- Monitor channel `1462305005376897289`
- Show user info with avatar, username, and current game
- Display timestamps in user's timezone
- Forward all messages to Roblox server

## 🌍 Timezone Commands

Users can set their timezone preferences:

```bash
!tz                          # Show current timezone
!tz set America/New_York     # Set timezone
!tz list                     # List common timezones
```

## 📊 Testing

1. Send a message in the monitored channel
2. Bot will reply with a rich embed showing:
   - Your display name & avatar
   - Your message
   - Current game/activity
   - Local time
3. Message is forwarded to Roblox server

## 🔧 Running Both Servers

To run Discord bot AND Roblox server together:
```bash
npm run both
```

## 📝 File Structure

```
✅ discord-bot-enhanced.js  ← Main bot (enhanced with timezone)
✅ discord-bot.js           ← Basic bot (no timezone features)
✅ timezone-manager.js      ← Handles user timezone preferences
✅ server.js                ← Your Roblox chat server
✅ setup.js                 ← Interactive setup wizard
✅ package.json            ← Dependencies
✅ .env                    ← Your config (created by setup)
```

## 🆘 Troubleshooting

**Bot doesn't respond:**
- Check bot token in `.env`
- Verify Privileged Gateway Intents are enabled
- Make sure bot has channel permissions

**Messages not forwarding:**
- Check Roblox server is running
- Test: `curl https://roblox-chat-server-z35g.onrender.com/health`

**Wrong channel being monitored:**
- Update `MONITOR_CHANNEL_ID` in `.env`

## 💡 Pro Tips

- Use `npm run dev` for auto-restart during development
- User timezone preferences are saved in `user-timezones.json`
- Check console for detailed logs
- Use `!tz` commands to customize timezone display

---

**Need help?** Check the full README.md for detailed documentation!
