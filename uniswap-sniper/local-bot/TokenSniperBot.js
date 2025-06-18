const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * Advanced Uniswap Token Sniper Bot
 * 
 * ⚠️ WARNING: This bot can lose money. Use at your own risk.
 * - Start with small amounts
 * - Test thoroughly on testnets
 * - Understand all risks involved
 * - Never invest more than you can afford to lose
 */
class TokenSniperBot {
    constructor(config) {
        this.config = config;
        this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
        this.wallet = new ethers.Wallet(config.privateKey, this.provider);
        
        // Contract instances
        this.sniperContract = new ethers.Contract(
            config.sniperAddress,
            config.sniperABI,
            this.wallet
        );
        
        this.uniswapFactory = new ethers.Contract(
            config.uniswapFactory,
            config.factoryABI,
            this.provider
        );
        
        this.uniswapRouter = new ethers.Contract(
            config.uniswapRouter,
            config.routerABI,
            this.provider
        );
        
        // Bot state
        this.isRunning = false;
        this.blacklistedTokens = new Set();
        this.recentTrades = [];
        this.profitHistory = [];
        this.tradingStats = {
            totalTrades: 0,
            successfulTrades: 0,
            totalProfit: ethers.BigNumber.from(0),
            totalLoss: ethers.BigNumber.from(0)
        };
        
        // Load blacklist and trading history
        this.loadPersistentData();
        
        console.log("🤖 TokenSniperBot initialized");
        console.log(`💰 Wallet: ${this.wallet.address}`);
        console.log(`🔗 Network: ${config.networkName}`);
    }
    
    /**
     * Start the sniping bot
     */
    async start() {
        console.log("🚀 Starting TokenSniperBot...");
        this.isRunning = true;
        
        // Monitor new pair creation
        this.monitorPairCreation();
        
        // Monitor existing positions
        this.monitorPositions();
        
        // Periodic maintenance
        this.startMaintenance();
        
        console.log("✅ Bot is now running!");
    }
    
    /**
     * Stop the bot
     */
    stop() {
        console.log("🛑 Stopping TokenSniperBot...");
        this.isRunning = false;
    }
    
    /**
     * Monitor Uniswap factory for new pair creation
     */
    monitorPairCreation() {
        console.log("👀 Monitoring for new token pairs...");
        
        this.uniswapFactory.on("PairCreated", async (token0, token1, pair, allPairsLength) => {
            if (!this.isRunning) return;
            
            try {
                console.log(`🆕 New pair detected: ${token0} / ${token1}`);
                
                // Determine which token is not WETH
                const wethAddress = this.config.wethAddress.toLowerCase();
                const targetToken = token0.toLowerCase() === wethAddress ? token1 : token0;
                
                // Skip if it's not paired with WETH
                if (token0.toLowerCase() !== wethAddress && token1.toLowerCase() !== wethAddress) {
                    console.log("⏭️ Skipping non-WETH pair");
                    return;
                }
                
                // Analyze token for sniping opportunity
                await this.analyzeAndSnipe(targetToken, pair);
                
            } catch (error) {
                console.error("❌ Error processing new pair:", error);
            }
        });
    }
    
    /**
     * Analyze token and decide whether to snipe
     */
    async analyzeAndSnipe(tokenAddress, pairAddress) {
        console.log(`🔍 Analyzing token: ${tokenAddress}`);
        
        try {
            // Skip blacklisted tokens
            if (this.blacklistedTokens.has(tokenAddress.toLowerCase())) {
                console.log("🚫 Token is blacklisted, skipping");
                return;
            }
            
            // Comprehensive token analysis
            const analysis = await this.performTokenAnalysis(tokenAddress, pairAddress);
            
            // Decision algorithm
            const shouldSnipe = this.evaluateSnipeDecision(analysis);
            
            if (shouldSnipe.decision) {
                console.log(`✅ Token passed analysis! Confidence: ${shouldSnipe.confidence}%`);
                await this.executeSnipe(tokenAddress, shouldSnipe.amount, shouldSnipe.slippage);
            } else {
                console.log(`❌ Token failed analysis: ${shouldSnipe.reason}`);
                
                // Add to blacklist if it's clearly a scam
                if (shouldSnipe.isScam) {
                    this.blacklistedTokens.add(tokenAddress.toLowerCase());
                    this.savePersistentData();
                }
            }
            
        } catch (error) {
            console.error("❌ Error in token analysis:", error);
        }
    }
    
    /**
     * Comprehensive token analysis
     */
    async performTokenAnalysis(tokenAddress, pairAddress) {
        const analysis = {
            tokenAddress,
            pairAddress,
            timestamp: Date.now(),
            scores: {},
            flags: {}
        };
        
        try {
            // Get token contract
            const tokenContract = new ethers.Contract(
                tokenAddress,
                this.config.erc20ABI,
                this.provider
            );
            
            // Basic token info
            analysis.name = await tokenContract.name().catch(() => "UNKNOWN");
            analysis.symbol = await tokenContract.symbol().catch(() => "UNKNOWN");
            analysis.decimals = await tokenContract.decimals().catch(() => 18);
            analysis.totalSupply = await tokenContract.totalSupply().catch(() => ethers.BigNumber.from(0));
            
            // Liquidity analysis
            const liquidityAnalysis = await this.analyzeLiquidity(pairAddress);
            analysis.liquidity = liquidityAnalysis;
            
            // Ownership analysis
            const ownershipAnalysis = await this.analyzeOwnership(tokenContract);
            analysis.ownership = ownershipAnalysis;
            
            // Contract analysis
            const contractAnalysis = await this.analyzeContract(tokenAddress);
            analysis.contract = contractAnalysis;
            
            // Market timing analysis
            const timingAnalysis = await this.analyzeMarketTiming();
            analysis.timing = timingAnalysis;
            
            // Calculate composite scores
            this.calculateAnalysisScores(analysis);
            
            return analysis;
            
        } catch (error) {
            console.error("❌ Error in token analysis:", error);
            analysis.error = error.message;
            return analysis;
        }
    }
    
    /**
     * Analyze liquidity conditions
     */
    async analyzeLiquidity(pairAddress) {
        const pairContract = new ethers.Contract(
            pairAddress,
            ['function getReserves() view returns (uint112, uint112, uint32)',
             'function token0() view returns (address)',
             'function token1() view returns (address)'],
            this.provider
        );
        
        const [reserve0, reserve1] = await pairContract.getReserves();
        const token0 = await pairContract.token0();
        const token1 = await pairContract.token1();
        
        const wethAddress = this.config.wethAddress.toLowerCase();
        const ethReserve = token0.toLowerCase() === wethAddress ? reserve0 : reserve1;
        const tokenReserve = token0.toLowerCase() === wethAddress ? reserve1 : reserve0;
        
        return {
            ethReserve: ethReserve,
            tokenReserve: tokenReserve,
            ethAmount: ethers.utils.formatEther(ethReserve),
            ratio: tokenReserve.gt(0) ? ethReserve.div(tokenReserve) : ethers.BigNumber.from(0)
        };
    }
    
    /**
     * Analyze token ownership
     */
    async analyzeOwnership(tokenContract) {
        try {
            let owner = null;
            try {
                owner = await tokenContract.owner();
            } catch {
                try {
                    owner = await tokenContract.getOwner();
                } catch {
                    // No owner function
                }
            }
            
            return {
                hasOwner: owner !== null,
                owner: owner,
                isRenounced: owner === ethers.constants.AddressZero
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    /**
     * Analyze contract for common scam patterns
     */
    async analyzeContract(tokenAddress) {
        try {
            // Get contract bytecode
            const code = await this.provider.getCode(tokenAddress);
            
            // Simple bytecode analysis for common scam patterns
            const analysis = {
                hasCode: code !== '0x',
                codeSize: code.length,
                suspiciousPatterns: []
            };
            
            // Check for common scam patterns (simplified)
            if (code.includes('selfdestruct')) {
                analysis.suspiciousPatterns.push('selfdestruct');
            }
            
            // Check for honeypot patterns (very basic)
            if (code.length < 1000) {
                analysis.suspiciousPatterns.push('minimal_code');
            }
            
            return analysis;
            
        } catch (error) {
            return { error: error.message };
        }
    }
    
    /**
     * Analyze market timing conditions
     */
    async analyzeMarketTiming() {
        try {
            const currentGasPrice = await this.provider.getGasPrice();
            const blockNumber = await this.provider.getBlockNumber();
            const block = await this.provider.getBlock(blockNumber);
            
            return {
                gasPrice: currentGasPrice,
                gasPriceGwei: ethers.utils.formatUnits(currentGasPrice, 'gwei'),
                blockTimestamp: block.timestamp,
                isHighGas: currentGasPrice.gt(ethers.utils.parseUnits('50', 'gwei'))
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    /**
     * Calculate analysis scores
     */
    calculateAnalysisScores(analysis) {
        let totalScore = 0;
        let maxScore = 0;
        
        // Liquidity score (0-30 points)
        let liquidityScore = 0;
        if (analysis.liquidity && analysis.liquidity.ethReserve) {
            const ethAmount = parseFloat(analysis.liquidity.ethAmount);
            if (ethAmount >= this.config.minLiquidityETH) liquidityScore += 15;
            if (ethAmount >= this.config.minLiquidityETH * 2) liquidityScore += 10;
            if (ethAmount < this.config.maxLiquidityETH) liquidityScore += 5; // Not too much liquidity
        }
        maxScore += 30;
        totalScore += liquidityScore;
        analysis.scores.liquidity = liquidityScore;
        
        // Ownership score (0-25 points)
        let ownershipScore = 0;
        if (analysis.ownership) {
            if (analysis.ownership.isRenounced) ownershipScore += 25;
            else if (!analysis.ownership.hasOwner) ownershipScore += 15;
            else ownershipScore += 0; // Has owner - risky
        }
        maxScore += 25;
        totalScore += ownershipScore;
        analysis.scores.ownership = ownershipScore;
        
        // Contract safety score (0-20 points)
        let contractScore = 20; // Start with full points
        if (analysis.contract && analysis.contract.suspiciousPatterns) {
            contractScore -= analysis.contract.suspiciousPatterns.length * 10;
        }
        contractScore = Math.max(0, contractScore);
        maxScore += 20;
        totalScore += contractScore;
        analysis.scores.contract = contractScore;
        
        // Timing score (0-15 points)
        let timingScore = 15;
        if (analysis.timing && analysis.timing.isHighGas) {
            timingScore -= 10; // Reduce score for high gas
        }
        maxScore += 15;
        totalScore += timingScore;
        analysis.scores.timing = timingScore;
        
        // Market conditions score (0-10 points)
        let marketScore = 10;
        // Reduce score if we've made too many recent trades
        if (this.recentTrades.length >= this.config.maxTradesPerHour) {
            marketScore -= 5;
        }
        maxScore += 10;
        totalScore += marketScore;
        analysis.scores.market = marketScore;
        
        // Calculate final score percentage
        analysis.totalScore = totalScore;
        analysis.maxScore = maxScore;
        analysis.scorePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        
        console.log(`📊 Analysis scores: ${totalScore}/${maxScore} (${analysis.scorePercentage.toFixed(1)}%)`);
    }
    
    /**
     * Evaluate whether to snipe based on analysis
     */
    evaluateSnipeDecision(analysis) {
        const decision = {
            decision: false,
            confidence: 0,
            reason: "",
            amount: ethers.utils.parseEther(this.config.defaultTradeAmount.toString()),
            slippage: this.config.defaultSlippage,
            isScam: false
        };
        
        // Check for immediate disqualifiers
        if (analysis.error) {
            decision.reason = "Analysis error";
            return decision;
        }
        
        if (!analysis.liquidity || parseFloat(analysis.liquidity.ethAmount) < this.config.minLiquidityETH) {
            decision.reason = "Insufficient liquidity";
            return decision;
        }
        
        if (parseFloat(analysis.liquidity.ethAmount) > this.config.maxLiquidityETH) {
            decision.reason = "Liquidity too high (potential trap)";
            return decision;
        }
        
        // Check for scam indicators
        if (analysis.contract && analysis.contract.suspiciousPatterns.length >= 2) {
            decision.reason = "Too many suspicious patterns";
            decision.isScam = true;
            return decision;
        }
        
        // Score-based decision
        const scoreThreshold = this.config.minScoreThreshold;
        
        if (analysis.scorePercentage >= scoreThreshold) {
            decision.decision = true;
            decision.confidence = analysis.scorePercentage;
            
            // Adjust trade amount based on confidence
            const confidenceMultiplier = analysis.scorePercentage / 100;
            const baseAmount = parseFloat(this.config.defaultTradeAmount);
            const adjustedAmount = baseAmount * confidenceMultiplier * this.config.riskMultiplier;
            
            decision.amount = ethers.utils.parseEther(Math.min(adjustedAmount, this.config.maxTradeAmount).toString());
            
            // Adjust slippage based on liquidity
            const liquidityETH = parseFloat(analysis.liquidity.ethAmount);
            if (liquidityETH < 1) {
                decision.slippage = this.config.defaultSlippage + 200; // Add 2% for low liquidity
            }
            
        } else {
            decision.reason = `Score too low: ${analysis.scorePercentage.toFixed(1)}% < ${scoreThreshold}%`;
        }
        
        return decision;
    }
    
    /**
     * Execute the snipe
     */
    async executeSnipe(tokenAddress, amount, slippage) {
        console.log(`🎯 Executing snipe: ${tokenAddress}`);
        console.log(`💰 Amount: ${ethers.utils.formatEther(amount)} ETH`);
        console.log(`📊 Slippage: ${slippage / 100}%`);
        
        try {
            // Check gas price and adjust if needed
            const gasPrice = await this.provider.getGasPrice();
            const adjustedGasPrice = gasPrice.mul(110).div(100); // 10% premium for speed
            
            // Execute snipe through our smart contract
            const tx = await this.sniperContract.snipeTokenWithETH(
                tokenAddress,
                slippage,
                {
                    value: amount,
                    gasPrice: adjustedGasPrice,
                    gasLimit: 300000
                }
            );
            
            console.log(`📤 Transaction sent: ${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            
            if (receipt.status === 1) {
                console.log(`✅ Snipe successful! Block: ${receipt.blockNumber}`);
                
                // Record successful trade
                this.recordTrade({
                    tokenAddress,
                    amount,
                    slippage,
                    txHash: tx.hash,
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed,
                    status: 'success',
                    timestamp: Date.now()
                });
                
                // Schedule sell order
                this.scheduleSellOrder(tokenAddress, amount);
                
            } else {
                console.log(`❌ Snipe failed in transaction`);
                this.recordTrade({
                    tokenAddress,
                    amount,
                    slippage,
                    txHash: tx.hash,
                    status: 'failed',
                    timestamp: Date.now()
                });
            }
            
        } catch (error) {
            console.error(`❌ Snipe execution error:`, error);
            
            // Check if it's a revert with reason
            if (error.reason) {
                console.log(`🔍 Revert reason: ${error.reason}`);
            }
        }
    }
    
    /**
     * Schedule sell order for profit taking
     */
    scheduleSellOrder(tokenAddress, originalAmount) {
        const sellConfig = this.config.sellStrategy;
        
        setTimeout(async () => {
            try {
                await this.executeSellOrder(tokenAddress, sellConfig);
            } catch (error) {
                console.error("❌ Scheduled sell error:", error);
            }
        }, sellConfig.delayMs);
    }
    
    /**
     * Execute sell order
     */
    async executeSellOrder(tokenAddress, sellConfig) {
        console.log(`💸 Executing sell order for: ${tokenAddress}`);
        
        try {
            // Get current token balance
            const tokenContract = new ethers.Contract(
                tokenAddress,
                this.config.erc20ABI,
                this.provider
            );
            
            const balance = await tokenContract.balanceOf(this.wallet.address);
            
            if (balance.gt(0)) {
                // Calculate sell amount based on strategy
                const sellAmount = balance.mul(sellConfig.percentage).div(100);
                
                // Execute sell through smart contract
                const tx = await this.sniperContract.sellTokenForETH(
                    tokenAddress,
                    sellAmount,
                    sellConfig.slippage
                );
                
                console.log(`📤 Sell transaction sent: ${tx.hash}`);
                const receipt = await tx.wait();
                
                if (receipt.status === 1) {
                    console.log(`✅ Sell successful!`);
                    this.calculateProfit(tokenAddress, receipt);
                } else {
                    console.log(`❌ Sell failed`);
                }
            }
            
        } catch (error) {
            console.error("❌ Sell execution error:", error);
        }
    }
    
    /**
     * Monitor existing positions
     */
    monitorPositions() {
        setInterval(async () => {
            if (!this.isRunning) return;
            
            try {
                // Check for emergency exit conditions
                await this.checkEmergencyExit();
                
                // Update profit/loss tracking
                await this.updateProfitTracking();
                
            } catch (error) {
                console.error("❌ Position monitoring error:", error);
            }
        }, 30000); // Check every 30 seconds
    }
    
    /**
     * Start maintenance tasks
     */
    startMaintenance() {
        // Clean up old trades every hour
        setInterval(() => {
            const oneHourAgo = Date.now() - 3600000;
            this.recentTrades = this.recentTrades.filter(trade => trade.timestamp > oneHourAgo);
        }, 3600000);
        
        // Save data every 10 minutes
        setInterval(() => {
            this.savePersistentData();
        }, 600000);
        
        // Log stats every 5 minutes
        setInterval(() => {
            this.logTradingStats();
        }, 300000);
    }
    
    /**
     * Record trade information
     */
    recordTrade(tradeInfo) {
        this.recentTrades.push(tradeInfo);
        this.tradingStats.totalTrades++;
        
        if (tradeInfo.status === 'success') {
            this.tradingStats.successfulTrades++;
        }
    }
    
    /**
     * Calculate and record profit
     */
    calculateProfit(tokenAddress, sellReceipt) {
        // This would require more complex tracking of buy/sell prices
        // For now, just log the event
        console.log(`📈 Profit calculation for ${tokenAddress} - implement detailed tracking`);
    }
    
    /**
     * Log trading statistics
     */
    logTradingStats() {
        const successRate = this.tradingStats.totalTrades > 0 
            ? (this.tradingStats.successfulTrades / this.tradingStats.totalTrades * 100).toFixed(1)
            : 0;
            
        console.log("📊 Trading Statistics:");
        console.log(`   Total Trades: ${this.tradingStats.totalTrades}`);
        console.log(`   Successful: ${this.tradingStats.successfulTrades}`);
        console.log(`   Success Rate: ${successRate}%`);
        console.log(`   Recent Trades (1h): ${this.recentTrades.length}`);
    }
    
    /**
     * Emergency exit conditions
     */
    async checkEmergencyExit() {
        // Check wallet balance
        const balance = await this.wallet.getBalance();
        const minBalance = ethers.utils.parseEther("0.1");
        
        if (balance.lt(minBalance)) {
            console.log("🚨 LOW ETH BALANCE - Consider stopping bot");
        }
        
        // Check for too many failed trades
        const recentFailed = this.recentTrades.filter(t => t.status === 'failed').length;
        if (recentFailed >= 5) {
            console.log("🚨 TOO MANY FAILED TRADES - Consider reviewing strategy");
        }
    }
    
    /**
     * Load persistent data
     */
    loadPersistentData() {
        try {
            const dataFile = path.join(__dirname, 'bot_data.json');
            if (fs.existsSync(dataFile)) {
                const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
                this.blacklistedTokens = new Set(data.blacklistedTokens || []);
                this.tradingStats = { ...this.tradingStats, ...data.tradingStats };
                console.log(`📂 Loaded ${this.blacklistedTokens.size} blacklisted tokens`);
            }
        } catch (error) {
            console.log("⚠️ Could not load persistent data, starting fresh");
        }
    }
    
    /**
     * Save persistent data
     */
    savePersistentData() {
        try {
            const data = {
                blacklistedTokens: Array.from(this.blacklistedTokens),
                tradingStats: this.tradingStats,
                lastUpdated: Date.now()
            };
            
            const dataFile = path.join(__dirname, 'bot_data.json');
            fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error("❌ Could not save persistent data:", error);
        }
    }
    
    /**
     * Update profit tracking
     */
    async updateProfitTracking() {
        // Implement detailed profit/loss tracking
        // This would require tracking token balances and prices
    }
}

module.exports = TokenSniperBot; 