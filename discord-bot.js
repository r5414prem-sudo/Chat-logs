// ═══════════════════════════════════════════════════════════
//  🤖 DISCORD TO ROBLOX CHAT BRIDGE BOT
//  Monitors Discord channel and forwards to Roblox chat server
//  Version 1.0.0
// ═══════════════════════════════════════════════════════════

const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder,
    ActivityType 
} = require('discord.js');
const axios = require('axios');

// ═══════════════════════════════════════════════════════════
//  ⚙️ CONFIGURATION
// ═══════════════════════════════════════════════════════════

const CONFIG = {
    // Discord Configuration
    DISCORD_TOKEN: process.env.DISCORD_TOKEN || 'YOUR_DISCORD_BOT_TOKEN',
    MONITOR_CHANNEL_ID: '1462305005376897289',
    
    // Roblox Server Configuration
    ROBLOX_SERVER_URL: 'https://roblox-chat-server-z35g.onrender.com',
    
    // Bot Settings
    STATUS_MESSAGE: '👀 Monitoring Chat',
    UPDATE_INTERVAL: 30000, // 30 seconds
};

// ═══════════════════════════════════════════════════════════
//  🤖 DISCORD CLIENT SETUP
// ═══════════════════════════════════════════════════════════

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

// ═══════════════════════════════════════════════════════════
//  🛠️ UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

const utils = {
    /**
     * Get user's local time in their timezone
     */
    getUserLocalTime(timezone = 'America/New_York') {
        try {
            const options = {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZone: timezone
            };
            return new Date().toLocaleTimeString('en-US', options);
        } catch (error) {
            // Fallback to UTC if timezone is invalid
            return new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZone: 'UTC'
            }) + ' UTC';
        }
    },

    /**
     * Get user's current game/activity from presence
     */
    getCurrentGame(member) {
        if (!member || !member.presence) return 'No Activity';
        
        const activities = member.presence.activities;
        if (!activities || activities.length === 0) return 'No Activity';

        // Find game activity
        const gameActivity = activities.find(
            activity => activity.type === ActivityType.Playing
        );

        if (gameActivity) {
            return gameActivity.name;
        }

        // Check for other activities
        const otherActivity = activities[0];
        const activityTypes = {
            [ActivityType.Streaming]: '🎥 Streaming',
            [ActivityType.Listening]: '🎵 Listening to',
            [ActivityType.Watching]: '📺 Watching',
            [ActivityType.Custom]: '💬',
            [ActivityType.Competing]: '🏆 Competing in'
        };

        const prefix = activityTypes[otherActivity.type] || '';
        return `${prefix} ${otherActivity.name || otherActivity.state || 'Unknown'}`.trim();
    },

    /**
     * Get user's avatar URL
     */
    getAvatarUrl(user) {
        if (user.avatar) {
            return user.displayAvatarURL({ dynamic: true, size: 256 });
        }
        return user.defaultAvatarURL;
    },

    /**
     * Detect timezone from user (placeholder - would need user settings)
     * For now, returns common timezones based on time of day
     */
    detectTimezone() {
        // This is a simplified version. In production, you'd want to:
        // 1. Store user timezone preferences in a database
        // 2. Use Discord locale data
        // 3. Allow users to set their timezone
        return 'America/New_York'; // Default timezone
    },

    /**
     * Format message for display
     */
    formatMessageInfo(message, member, timezone) {
        const userTime = this.getUserLocalTime(timezone);
        const game = this.getCurrentGame(member);
        const avatarUrl = this.getAvatarUrl(message.author);

        return {
            username: message.author.username,
            displayName: member?.displayName || message.author.username,
            discriminator: message.author.discriminator,
            avatarUrl: avatarUrl,
            message: message.content,
            game: game,
            timestamp: userTime,
            timezone: timezone,
            userId: message.author.id
        };
    }
};

// ═══════════════════════════════════════════════════════════
//  📡 ROBLOX SERVER INTEGRATION
// ═══════════════════════════════════════════════════════════

const robloxIntegration = {
    /**
     * Send message to Roblox chat server
     */
    async sendToRoblox(messageData) {
        try {
            const payload = {
                username: `[Discord] ${messageData.displayName}`,
                message: messageData.message,
                game: messageData.game,
                userId: messageData.userId,
                metadata: {
                    discordUsername: messageData.username,
                    timestamp: messageData.timestamp,
                    timezone: messageData.timezone,
                    avatarUrl: messageData.avatarUrl
                }
            };

            const response = await axios.post(
                `${CONFIG.ROBLOX_SERVER_URL}/send`,
                payload,
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 5000
                }
            );

            if (response.data.success) {
                console.log(`✅ Sent to Roblox: ${messageData.displayName}: ${messageData.message}`);
                return true;
            } else {
                console.error('❌ Roblox server error:', response.data);
                return false;
            }

        } catch (error) {
            console.error('❌ Failed to send to Roblox:', error.message);
            return false;
        }
    },

    /**
     * Check Roblox server health
     */
    async checkServerHealth() {
        try {
            const response = await axios.get(
                `${CONFIG.ROBLOX_SERVER_URL}/health`,
                { timeout: 5000 }
            );
            return response.data.status === 'healthy';
        } catch (error) {
            console.error('⚠️  Roblox server health check failed');
            return false;
        }
    }
};

// ═══════════════════════════════════════════════════════════
//  💬 MESSAGE HANDLING
// ═══════════════════════════════════════════════════════════

async function handleDiscordMessage(message) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Only monitor specific channel
    if (message.channel.id !== CONFIG.MONITOR_CHANNEL_ID) return;

    try {
        // Get member object for presence data
        const member = message.guild.members.cache.get(message.author.id);
        
        // Detect timezone (you can enhance this with user settings)
        const timezone = utils.detectTimezone();

        // Format message data
        const messageData = utils.formatMessageInfo(message, member, timezone);

        // Create rich embed for Discord display
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({
                name: messageData.displayName,
                iconURL: messageData.avatarUrl
            })
            .setDescription(`💬 ${messageData.message}`)
            .addFields(
                { name: '👤 Username', value: messageData.username, inline: true },
                { name: '🎮 Activity', value: messageData.game, inline: true },
                { name: '🕐 Local Time', value: messageData.timestamp, inline: true }
            )
            .setThumbnail(messageData.avatarUrl)
            .setFooter({ text: `Timezone: ${timezone}` })
            .setTimestamp();

        // Send formatted message back to channel
        await message.channel.send({ embeds: [embed] });

        // Forward to Roblox server
        await robloxIntegration.sendToRoblox(messageData);

        console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📨 MESSAGE PROCESSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 User: ${messageData.displayName} (${messageData.username})
💬 Message: ${messageData.message}
🎮 Game: ${messageData.game}
🕐 Time: ${messageData.timestamp}
🌍 Timezone: ${timezone}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);

    } catch (error) {
        console.error('❌ Error handling message:', error);
        await message.channel.send('⚠️ Error processing message. Please try again.');
    }
}

// ═══════════════════════════════════════════════════════════
//  🎯 EVENT HANDLERS
// ═══════════════════════════════════════════════════════════

client.on('ready', async () => {
    console.log('\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🤖 DISCORD BOT ONLINE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Bot: ${client.user.tag}`);
    console.log(`  ID: ${client.user.id}`);
    console.log(`  Monitoring Channel: ${CONFIG.MONITOR_CHANNEL_ID}`);
    console.log(`  Roblox Server: ${CONFIG.ROBLOX_SERVER_URL}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Started: ${new Date().toISOString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Set bot status
    client.user.setActivity(CONFIG.STATUS_MESSAGE, { type: ActivityType.Watching });

    // Check Roblox server health
    const isHealthy = await robloxIntegration.checkServerHealth();
    console.log(`🏥 Roblox Server Health: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}\n`);

    // Periodic health check
    setInterval(async () => {
        const healthy = await robloxIntegration.checkServerHealth();
        if (!healthy) {
            console.log('⚠️  Warning: Roblox server appears to be down');
        }
    }, CONFIG.UPDATE_INTERVAL);
});

client.on('messageCreate', handleDiscordMessage);

client.on('error', (error) => {
    console.error('❌ Discord client error:', error);
});

client.on('warn', (warning) => {
    console.warn('⚠️  Discord client warning:', warning);
});

// ═══════════════════════════════════════════════════════════
//  🚀 BOT STARTUP
// ═══════════════════════════════════════════════════════════

async function startBot() {
    try {
        console.log('🔄 Logging in to Discord...');
        await client.login(CONFIG.DISCORD_TOKEN);
    } catch (error) {
        console.error('❌ Failed to login:', error);
        process.exit(1);
    }
}

// ═══════════════════════════════════════════════════════════
//  🛑 GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════

const shutdown = async (signal) => {
    console.log(`\n👋 Received ${signal}, shutting down gracefully...`);
    
    try {
        await client.destroy();
        console.log('✅ Discord client closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the bot
startBot();

// ═══════════════════════════════════════════════════════════
//  📝 EXPORTS
// ═══════════════════════════════════════════════════════════

module.exports = {
    client,
    utils,
    robloxIntegration
};
