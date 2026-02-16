// ═══════════════════════════════════════════════════════════
//  🌍 TIMEZONE MANAGER
//  Stores and retrieves user timezone preferences
// ═══════════════════════════════════════════════════════════

const fs = require('fs').promises;
const path = require('path');

class TimezoneManager {
    constructor() {
        this.storageFile = path.join(__dirname, 'user-timezones.json');
        this.timezones = new Map();
        this.defaultTimezone = 'America/New_York';
    }

    /**
     * Load timezones from file
     */
    async load() {
        try {
            const data = await fs.readFile(this.storageFile, 'utf8');
            const parsed = JSON.parse(data);
            this.timezones = new Map(Object.entries(parsed));
            console.log(`📍 Loaded ${this.timezones.size} user timezones`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('📍 No timezone data found, starting fresh');
                this.timezones = new Map();
            } else {
                console.error('❌ Error loading timezones:', error);
            }
        }
    }

    /**
     * Save timezones to file
     */
    async save() {
        try {
            const obj = Object.fromEntries(this.timezones);
            await fs.writeFile(
                this.storageFile,
                JSON.stringify(obj, null, 2),
                'utf8'
            );
        } catch (error) {
            console.error('❌ Error saving timezones:', error);
        }
    }

    /**
     * Get user's timezone
     */
    get(userId) {
        return this.timezones.get(userId) || this.defaultTimezone;
    }

    /**
     * Set user's timezone
     */
    async set(userId, timezone) {
        // Validate timezone
        try {
            new Date().toLocaleString('en-US', { timeZone: timezone });
            this.timezones.set(userId, timezone);
            await this.save();
            return true;
        } catch (error) {
            console.error(`❌ Invalid timezone: ${timezone}`);
            return false;
        }
    }

    /**
     * Get all timezones
     */
    getAll() {
        return Object.fromEntries(this.timezones);
    }

    /**
     * Common timezone list
     */
    static getCommonTimezones() {
        return {
            // North America
            'EST': 'America/New_York',
            'CST': 'America/Chicago',
            'MST': 'America/Denver',
            'PST': 'America/Los_Angeles',
            'AKST': 'America/Anchorage',
            'HST': 'Pacific/Honolulu',
            
            // Europe
            'GMT': 'Europe/London',
            'CET': 'Europe/Paris',
            'EET': 'Europe/Athens',
            'MSK': 'Europe/Moscow',
            
            // Asia
            'IST': 'Asia/Kolkata',
            'CST_ASIA': 'Asia/Shanghai',
            'JST': 'Asia/Tokyo',
            'KST': 'Asia/Seoul',
            
            // Oceania
            'AEST': 'Australia/Sydney',
            'NZST': 'Pacific/Auckland',
            
            // South America
            'BRT': 'America/Sao_Paulo',
            'ART': 'America/Argentina/Buenos_Aires',
            
            // Africa
            'SAST': 'Africa/Johannesburg',
            'EAT': 'Africa/Nairobi'
        };
    }
}

module.exports = TimezoneManager;
