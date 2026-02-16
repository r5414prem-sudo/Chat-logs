// ═══════════════════════════════════════════════════════════
//  🤖 DISCORD TO ROBLOX CHAT BRIDGE BOT - ENHANCED
//  Version 2.0.0 with Timezone Support & Commands
// ═══════════════════════════════════════════════════════════

const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder,
    ActivityType,
    REST,
    Routes
} = require('discord.js');
const axios = require('axios');
const TimezoneManager = require('./timezone-manager');

// ═══════════════════════════════════════════════════════════
//  ⚙️ CONFIGURATION
// ═══════════════════════════════════════════════════════════

const CONFIG = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN || 'YOUR_DISCORD_BOT_TOKEN',
    MONITOR_CHANNEL_ID: '1462305005376897289',
    ROBLOX_SERVER_URL: 'https://roblox-chat-server-z35g.onrender.com',
    STATUS_MESSAGE: '👀 Monitoring Chat',
    UPDATE_INTERVAL: 30000,
    COMMAND_PREFIX: '!tz',
};

// ═══════════════════════════════════════════════════════════
//  🤖 DISCORD CLIENT & MANAGERS
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

const timezoneManager = new TimezoneManager();

// ═══════════════════════════════════════════════════════════
//  🛠️ UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

const utils = {
    getUserLocalTime(timezone = 'America/New_York') {
        try {
            const now = new Date();
            const dateOptions = {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                timeZone: timezone
            };
            const timeOptions = {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZone: timezone
            };
            
            const date = now.toLocaleDateString('en-US', dateOptions);
            const time = now.toLocaleTimeString('en-US', timeOptions);
            
            return {
                full: `${date} ${time}`,
                time: time,
                date: date,
                timezone: timezone
            };
        } catch (error) {
            return {
                full: new Date().toISOString(),
                time: 'Invalid TZ',
                date: 'Invalid TZ',
                timezone: timezone
            };
        }
    },

    getCurrentGame(member) {
        if (!member || !member.presence) return 'No Activity';
        
        const activities = member.presence.activities;
        if (!activities || activities.length === 0) return 'No Activity';

        const gameActivity = activities.find(
            activity => activity.type === ActivityType.Playing
        );

        if (gameActivity) {
            return `🎮 ${gameActivity.name}`;
        }

        const otherActivity = activities[0];
        const activityTypes = {
            [ActivityType.Streaming]: '🎥 Streaming',
            [ActivityType.Listening]: '🎵 Listening to',
            [ActivityType.Watching]: '📺 Watching',
            [ActivityType.Custom]: '💬',
            [ActivityType.Competing]: '🏆 Competing in'
        };

        const prefix = activityTypes[otherActivity.type] || '📱';
        const activityName = otherActivity.name || otherActivity.state || 'Unknown';
        return `${prefix} ${activityName}`.trim();
    },

    getAvatarUrl(user) {
        return user.displayAvatarURL({ dynamic: true, size: 256 });
    },

    getEmbedColor(game) {
        // Color based on activity type
        if (game.includes('🎮')) return '#5865F2'; // Discord Blue
        if (game.includes('🎥')) return '#9146FF'; // Twitch Purple
        if (game.includes('🎵')) return '#1DB954'; // Spotify Green
        if (game.includes('📺')) return '#FF0000'; // YouTube Red
        if (game === 'No Activity') return '#99AAB5'; // Gray
        return '#5865F2'; // Default Discord Blue
    },

    formatMessageInfo(message, member, timezone) {
        const timeInfo = this.getUserLocalTime(timezone);
        const game = this.getCurrentGame(member);
        const avatarUrl = this.getAvatarUrl(message.author);

        return {
            username: message.author.username,
            displayName: member?.displayName || message.author.username,
            discriminator: message.author.discriminator,
            avatarUrl: avatarUrl,
            message: message.content,
            game: game,
            timestamp: timeInfo.time,
            fullTimestamp: timeInfo.full,
            timezone: timezone,
            userId: message.author.id,
            color: this.getEmbedColor(game)
        };
    }
};

// ═══════════════════════════════════════════════════════════
//  📡 ROBLOX SERVER INTEGRATION
// ═══════════════════════════════════════════════════════════

const robloxIntegration = {
    async sendToRoblox(messageData) {
        try {
            const payload = {
                username: `[Discord] ${messageData.displayName}`,
                message: messageData.message,
                game: messageData.game,
                userId: messageData.userId,
                metadata: {
                    discordUsername: messageData.username,
                    timestamp: messageData.fullTimestamp,
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
            }
            return false;

        } catch (error) {
            console.error('❌ Roblox send error:', error.message);
            return false;
        }
    },

    async checkServerHealth() {
        try {
            const response = await axios.get(
                `${CONFIG.ROBLOX_SERVER_URL}/health`,
                { timeout: 5000 }
            );
            return response.data.status === 'healthy';
        } catch (error) {
            return false;
        }
    }
};

// ═══════════════════════════════════════════════════════════
//  💬 COMMAND HANDLER
// ═══════════════════════════════════════════════════════════

const commandHandler = {
    async handleTimezoneCommand(message, args) {
        const userId = message.author.id;

        // !tz - Show current timezone
        if (args.length === 0) {
            const currentTz = timezoneManager.get(userId);
            const timeInfo = utils.getUserLocalTime(currentTz);
            
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🌍 Your Timezone Settings')
                .setDescription(`Your current timezone: **${currentTz}**`)
                .addFields(
                    { name: '🕐 Your Local Time', value: timeInfo.full, inline: false },
                    { name: 'ℹ️ How to Change', value: `Use \`${CONFIG.COMMAND_PREFIX} set <timezone>\``, inline: false }
                )
                .setFooter({ text: `Use ${CONFIG.COMMAND_PREFIX} list to see available timezones` });
            
            return message.reply({ embeds: [embed] });
        }

        // !tz set <timezone>
        if (args[0] === 'set' && args[1]) {
            const timezone = args.slice(1).join(' ');
            const success = await timezoneManager.set(userId, timezone);
            
            if (success) {
                const timeInfo = utils.getUserLocalTime(timezone);
                const embed = new EmbedBuilder()
                    .setColor('#57F287')
                    .setTitle('✅ Timezone Updated')
                    .setDescription(`Your timezone has been set to: **${timezone}**`)
                    .addFields({ name: '🕐 Your Local Time', value: timeInfo.full })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            } else {
                return message.reply('❌ Invalid timezone! Use `!tz list` to see available timezones.');
            }
        }

        // !tz list - Show common timezones
        if (args[0] === 'list') {
            const timezones = TimezoneManager.getCommonTimezones();
            let description = '**Common Timezones:**\n\n';
            
            for (const [abbr, tz] of Object.entries(timezones)) {
                description += `• \`${abbr}\` → ${tz}\n`;
            }
            
            description += `\n**Usage:** \`${CONFIG.COMMAND_PREFIX} set America/New_York\``;
            
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🌍 Available Timezones')
                .setDescription(description)
                .setFooter({ text: 'You can use any valid IANA timezone identifier' });
            
            return message.reply({ embeds: [embed] });
        }

        // Help message
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🌍 Timezone Commands')
            .setDescription('Manage your timezone preferences')
            .addFields(
                { name: `${CONFIG.COMMAND_PREFIX}`, value: 'Show your current timezone', inline: false },
                { name: `${CONFIG.COMMAND_PREFIX} set <timezone>`, value: 'Set your timezone', inline: false },
                { name: `${CONFIG.COMMAND_PREFIX} list`, value: 'List common timezones', inline: false }
            )
            .setFooter({ text: 'Example: !tz set America/Los_Angeles' });
        
        return message.reply({ embeds: [embed] });
    }
};

// ═══════════════════════════════════════════════════════════
//  💬 MESSAGE HANDLING
// ═══════════════════════════════════════════════════════════

async function handleDiscordMessage(message) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Handle timezone commands in any channel
    if (message.content.startsWith(CONFIG.COMMAND_PREFIX)) {
        const args = message.content.slice(CONFIG.COMMAND_PREFIX.length).trim().split(/\s+/);
        return commandHandler.handleTimezoneCommand(message, args);
    }

    // Only monitor specific channel for regular messages
    if (message.channel.id !== CONFIG.MONITOR_CHANNEL_ID) return;

    try {
        const member = message.guild.members.cache.get(message.author.id);
        const timezone = timezoneManager.get(message.author.id);
        const messageData = utils.formatMessageInfo(message, member, timezone);

        // Create rich embed
        const embed = new EmbedBuilder()
            .setColor(messageData.color)
            .setAuthor({
                name: messageData.displayName,
                iconURL: messageData.avatarUrl
            })
            .setDescription(`💬 ${messageData.message}`)
            .addFields(
                { name: '👤 Username', value: `${messageData.username}`, inline: true },
                { name: '🎮 Activity', value: messageData.game, inline: true },
                { name: '🕐 Local Time', value: messageData.timestamp, inline: true }
            )
            .setThumbnail(messageData.avatarUrl)
            .setFooter({ text: `Timezone: ${messageData.timezone}` })
            .setTimestamp();

        // Send formatted message
        await message.channel.send({ embeds: [embed] });

        // Forward to Roblox
        await robloxIntegration.sendToRoblox(messageData);

        console.log(`📨 ${messageData.displayName}: ${messageData.message} [${messageData.game}]`);

    } catch (error) {
        console.error('❌ Message handling error:', error);
    }
}

// ═══════════════════════════════════════════════════════════
//  🎯 EVENT HANDLERS
// ═══════════════════════════════════════════════════════════

client.on('ready', async () => {
    console.log('\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🤖 DISCORD BOT ONLINE (Enhanced v2.0)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Bot: ${client.user.tag}`);
    console.log(`  Monitoring: ${CONFIG.MONITOR_CHANNEL_ID}`);
    console.log(`  Roblox: ${CONFIG.ROBLOX_SERVER_URL}`);
    console.log(`  Commands: ${CONFIG.COMMAND_PREFIX}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Load timezone preferences
    await timezoneManager.load();

    // Set status
    client.user.setActivity(CONFIG.STATUS_MESSAGE, { type: ActivityType.Watching });

    // Health check
    const healthy = await robloxIntegration.checkServerHealth();
    console.log(`🏥 Roblox Server: ${healthy ? '✅ Online' : '❌ Offline'}\n`);

    // Periodic health monitoring
    setInterval(async () => {
        const isHealthy = await robloxIntegration.checkServerHealth();
        if (!isHealthy) {
            console.log('⚠️  Roblox server unreachable');
        }
    }, CONFIG.UPDATE_INTERVAL);
});

client.on('messageCreate', handleDiscordMessage);

client.on('error', (error) => {
    console.error('❌ Discord error:', error);
});

// ═══════════════════════════════════════════════════════════
//  🚀 BOT STARTUP
// ═══════════════════════════════════════════════════════════

async function startBot() {
    try {
        console.log('🔄 Starting Discord bot...');
        await client.login(CONFIG.DISCORD_TOKEN);
    } catch (error) {
        console.error('❌ Login failed:', error);
        process.exit(1);
    }
}

// ═══════════════════════════════════════════════════════════
//  🛑 GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════

const shutdown = async (signal) => {
    console.log(`\n👋 Shutting down (${signal})...`);
    await timezoneManager.save();
    await client.destroy();
    console.log('✅ Goodbye!');
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startBot();

module.exports = { client, utils, robloxIntegration, timezoneManager };
