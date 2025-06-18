#!/usr/bin/env node

/**
 * Main entry point for TokenSniperBot
 * 
 * Usage:
 *   node main.js                    # Run on mainnet
 *   NETWORK=testnet node main.js    # Run on testnet
 *   
 * Environment variables:
 *   PRIVATE_KEY          - Your wallet private key
 *   RPC_URL             - Ethereum RPC endpoint
 *   SNIPER_ADDRESS      - Deployed sniper contract address
 *   NETWORK             - 'mainnet' or 'testnet'
 */

const TokenSniperBot = require('./TokenSniperBot');
const config = require('./config');

// Banner
console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    🎯 TOKEN SNIPER BOT 🎯                     ║
║                                                               ║
║  ⚠️  WARNING: This bot can lose money. Use at your own risk! ║
║                                                               ║
║  📋 Before running:                                           ║
║     • Test on testnets first                                 ║
║     • Start with small amounts                               ║
║     • Understand all risks involved                          ║
║     • Never invest more than you can afford to lose          ║
║                                                               ║
║  🔒 Security:                                                 ║
║     • Keep your private keys secure                          ║
║     • Use environment variables                              ║
║     • Monitor your trades actively                           ║
╚═══════════════════════════════════════════════════════════════╝
`);

async function main() {
    try {
        // Determine network
        const isTestnet = process.env.NETWORK === 'testnet';
        const networkConfig = isTestnet ? config.testnet : config.mainnet;
        
        console.log(`🌐 Network: ${networkConfig.networkName}`);
        console.log(`💰 Default trade amount: ${networkConfig.defaultTradeAmount} ETH`);
        console.log(`📊 Min analysis score: ${networkConfig.minScoreThreshold}%`);
        
        // Safety confirmation for mainnet
        if (!isTestnet && !process.env.SKIP_CONFIRMATION) {
            console.log(`
⚠️  You are about to run the bot on MAINNET with REAL MONEY!

Current configuration:
• Wallet: ${networkConfig.privateKey.substring(0, 10)}...
• Trade amount: ${networkConfig.defaultTradeAmount} ETH per trade
• Max trade amount: ${networkConfig.maxTradeAmount} ETH
• Daily limit: Not set (check your contract)

Are you sure you want to continue? (y/N)
`);
            
            // Wait for user confirmation
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            const answer = await new Promise(resolve => {
                readline.question('', resolve);
            });
            
            readline.close();
            
            if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
                console.log("🛑 Bot startup cancelled by user");
                process.exit(0);
            }
        }
        
        // Initialize bot
        console.log("🔧 Initializing TokenSniperBot...");
        const bot = new TokenSniperBot(networkConfig);
        
        // Setup graceful shutdown
        setupGracefulShutdown(bot);
        
        // Start the bot
        await bot.start();
        
        console.log(`
✅ Bot is now running!

Commands:
• Ctrl+C: Stop the bot gracefully
• SIGUSR1: Log current statistics
• SIGUSR2: Save current state

Monitor the logs for trading activity...
`);
        
        // Keep the process alive
        await new Promise(resolve => {
            // The bot will run indefinitely until manually stopped
        });
        
    } catch (error) {
        console.error("💥 Fatal error starting bot:", error);
        process.exit(1);
    }
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(bot) {
    let isShuttingDown = false;
    
    const shutdown = async (signal) => {
        if (isShuttingDown) return;
        isShuttingDown = true;
        
        console.log(`\n🚨 Received ${signal}, shutting down gracefully...`);
        
        try {
            // Stop the bot
            bot.stop();
            
            // Save final data
            bot.savePersistentData();
            
            // Log final stats
            bot.logTradingStats();
            
            console.log("✅ Bot stopped gracefully");
            process.exit(0);
            
        } catch (error) {
            console.error("❌ Error during shutdown:", error);
            process.exit(1);
        }
    };
    
    // Handle various shutdown signals
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGQUIT', () => shutdown('SIGQUIT'));
    
    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
        console.error("💥 Uncaught exception:", error);
        shutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error("💥 Unhandled rejection at:", promise, 'reason:', reason);
        shutdown('UNHANDLED_REJECTION');
    });
    
    // Custom signal handlers for debugging
    process.on('SIGUSR1', () => {
        console.log("📊 Logging current statistics...");
        bot.logTradingStats();
    });
    
    process.on('SIGUSR2', () => {
        console.log("💾 Saving current state...");
        bot.savePersistentData();
    });
}

/**
 * Pre-flight checks
 */
async function preflightChecks() {
    console.log("🔍 Running pre-flight checks...");
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 14) {
        console.error(`❌ Node.js version ${nodeVersion} is too old. Please use Node.js 14 or higher.`);
        process.exit(1);
    }
    
    // Check required packages
    try {
        require('ethers');
        console.log("✅ ethers.js found");
    } catch (error) {
        console.error("❌ ethers.js not found. Run: npm install ethers");
        process.exit(1);
    }
    
    console.log("✅ Pre-flight checks passed");
}

// Run pre-flight checks and start
preflightChecks().then(() => {
    main().catch(error => {
        console.error("💥 Fatal error:", error);
        process.exit(1);
    });
});

// Export for testing
module.exports = { main }; 