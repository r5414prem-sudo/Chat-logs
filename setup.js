#!/usr/bin/env node

// ═══════════════════════════════════════════════════════════
//  🚀 SETUP WIZARD
//  Interactive setup for Discord-Roblox Bridge Bot
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

console.log('\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  🤖 Discord-Roblox Bridge Setup Wizard');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function setup() {
    console.log('This wizard will help you configure your bot.\n');

    // Check if .env exists
    const envPath = path.join(__dirname, '.env');
    const envExists = fs.existsSync(envPath);

    if (envExists) {
        const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
        if (overwrite.toLowerCase() !== 'y') {
            console.log('\n✅ Setup cancelled. Your existing .env is unchanged.\n');
            rl.close();
            return;
        }
    }

    // Get Discord token
    console.log('\n📝 Step 1: Discord Bot Token');
    console.log('   Get your token from: https://discord.com/developers/applications\n');
    const token = await question('   Enter your Discord bot token: ');

    if (!token || token.trim().length < 50) {
        console.log('\n❌ Invalid token. Please run setup again with a valid token.\n');
        rl.close();
        return;
    }

    // Get channel ID (optional)
    console.log('\n📝 Step 2: Monitor Channel ID');
    console.log('   Default: 1462305005376897289\n');
    const channelId = await question('   Enter channel ID (press Enter for default): ');

    // Get Roblox server URL (optional)
    console.log('\n📝 Step 3: Roblox Server URL');
    console.log('   Default: https://roblox-chat-server-z35g.onrender.com\n');
    const serverUrl = await question('   Enter Roblox server URL (press Enter for default): ');

    // Create .env file
    let envContent = `# Discord Bot Configuration\nDISCORD_TOKEN=${token.trim()}\n`;

    if (channelId.trim()) {
        envContent += `\n# Monitor Channel\nMONITOR_CHANNEL_ID=${channelId.trim()}\n`;
    }

    if (serverUrl.trim()) {
        envContent += `\n# Roblox Server\nROBLOX_SERVER_URL=${serverUrl.trim()}\n`;
    }

    // Write .env file
    try {
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log('\n✅ Configuration saved to .env file!');
    } catch (error) {
        console.log('\n❌ Error writing .env file:', error.message);
        rl.close();
        return;
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ✨ Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Configuration Summary:');
    console.log(`   Bot Token: ${token.substring(0, 20)}...`);
    console.log(`   Channel ID: ${channelId.trim() || '1462305005376897289 (default)'}`);
    console.log(`   Roblox URL: ${serverUrl.trim() || 'https://roblox-chat-server-z35g.onrender.com (default)'}`);

    console.log('\n📝 Next Steps:');
    console.log('   1. Make sure you\'ve invited the bot to your Discord server');
    console.log('   2. Enable these in Discord Developer Portal:');
    console.log('      - Server Members Intent');
    console.log('      - Message Content Intent');
    console.log('      - Presence Intent');
    console.log('   3. Run: npm start');

    console.log('\n💡 Tips:');
    console.log('   - Use !tz commands to set your timezone');
    console.log('   - Check logs for any connection issues');
    console.log('   - Visit the channel to test message detection\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    rl.close();
}

setup().catch(error => {
    console.error('❌ Setup error:', error);
    rl.close();
});
