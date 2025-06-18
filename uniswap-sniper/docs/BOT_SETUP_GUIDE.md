# 🤖 Token Sniper Bot Setup Guide

## 🚨 **CRITICAL WARNING**
This bot trades with **REAL MONEY** and can **LOSE ALL YOUR FUNDS**. Before proceeding:
- ✅ Understand that you could lose 100% of your investment
- ✅ Only use money you can afford to lose completely
- ✅ Test thoroughly on testnets first
- ✅ Start with very small amounts (0.01 ETH)
- ✅ Monitor the bot constantly when running
- ✅ Understand all legal implications in your jurisdiction

## 📋 **Prerequisites**

### System Requirements
- **Node.js** 14.0.0 or higher
- **npm** or **yarn**
- **Terminal/Command Line** access
- **Ethereum wallet** with ETH for trading
- **RPC endpoint** (Alchemy, Infura, or similar)

### Knowledge Requirements
- Basic understanding of Ethereum and smart contracts
- Understanding of Uniswap trading mechanics  
- Knowledge of gas fees and transaction costs
- Basic command line usage

## 🚀 **Step-by-Step Setup**

### Step 1: Deploy Smart Contract (Remix)
1. **Open Remix IDE**: https://remix.ethereum.org/
2. **Import contracts** from your `contracts/` folder
3. **Compile** with Solidity 0.8.19+
4. **Deploy** `UniswapSniper.sol` using `DeployScript.sol`
5. **Copy the contract address** - you'll need this for the bot

### Step 2: Get Required Services

#### RPC Endpoint (Required)
Choose one:
- **Alchemy**: https://alchemy.com (recommended)
- **Infura**: https://infura.io
- **QuickNode**: https://quicknode.com

Create an account and get your HTTP endpoint URL.

#### Wallet Setup
1. **Export private key** from MetaMask (⚠️ NEVER SHARE THIS!)
2. **Keep separate trading wallet** with limited funds
3. **Fund wallet** with ETH for gas and trading

### Step 3: Install Bot Dependencies

```bash
# Navigate to bot directory
cd bot/

# Install dependencies
npm install

# Or use yarn
yarn install
```

### Step 4: Configure Environment Variables

Create a `.env` file in the `bot/` directory:

```bash
# Create .env file
touch .env
```

Add the following to `.env`:

```env
# ⚠️ SENSITIVE DATA - NEVER COMMIT TO GIT!

# Network Configuration
NETWORK=testnet                                    # Use 'testnet' for testing, 'mainnet' for real trading
RPC_URL=https://eth-goerli.alchemyapi.io/v2/YOUR_API_KEY
GOERLI_RPC_URL=https://eth-goerli.alchemyapi.io/v2/YOUR_API_KEY

# Wallet (⚠️ KEEP PRIVATE!)
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# Contract Address (from Step 1)
SNIPER_ADDRESS=0x...your_deployed_contract_address...

# Optional: Skip safety confirmation
SKIP_CONFIRMATION=false
```

### Step 5: Configure Trading Parameters

Edit `config.js` to adjust trading parameters:

```javascript
// Trading Parameters
defaultTradeAmount: 0.01,        // Start SMALL! (0.01 ETH = ~$20)
maxTradeAmount: 0.05,            // Maximum per trade
minLiquidityETH: 0.1,            // Minimum liquidity to consider
maxLiquidityETH: 10.0,           // Maximum liquidity (avoid whale traps)
minScoreThreshold: 70,           // Minimum analysis score (70% = conservative)
```

## 🧪 **Testing Phase**

### Step 1: Test on Testnet
```bash
# Run on Goerli testnet
NETWORK=testnet npm start
```

### Step 2: Get Testnet ETH
- **Goerli Faucet**: https://goerlifaucet.com/
- **Alchemy Faucet**: https://goerlifaucet.com/
- Get at least 1 testnet ETH for testing

### Step 3: Monitor Test Runs
- Watch the console output
- Check for any errors
- Verify trades execute correctly
- Test emergency stop features

## 🎯 **Production Deployment**

### Step 1: Final Configuration Check
```bash
# Verify all configuration
node -c config.js
```

### Step 2: Start on Mainnet (⚠️ REAL MONEY!)
```bash
# This will ask for confirmation
npm start

# Or skip confirmation (dangerous!)
SKIP_CONFIRMATION=true npm start
```

## 📊 **Bot Operation**

### What the Bot Does
1. **Monitors** Uniswap for new token pairs
2. **Analyzes** each token for profitability and safety
3. **Scores** tokens based on multiple criteria
4. **Executes** trades automatically if score > threshold
5. **Manages** positions with automated selling

### Analysis Criteria
- **Liquidity**: Sufficient but not excessive ETH liquidity
- **Ownership**: Prefers renounced ownership
- **Contract**: Scans for suspicious patterns
- **Timing**: Considers gas prices and market conditions
- **Market**: Rate limits and recent performance

### Automated Selling
- **Delay**: Waits 5 minutes after purchase
- **Percentage**: Sells 80% of holdings by default
- **Stop Loss**: Emergency sell if down 50%
- **Take Profit**: Auto-sell if up 200%

## 🛠 **Commands and Controls**

### Starting/Stopping
```bash
# Start bot
npm start

# Start on testnet
npm run start:testnet

# Stop bot (Ctrl+C)
# The bot will shutdown gracefully
```

### Real-time Commands
```bash
# Send signal to log statistics
kill -USR1 <process_id>

# Send signal to save state
kill -USR2 <process_id>
```

### Monitoring
- **Console Output**: Real-time trade information
- **Log Files**: `bot_data.json` contains persistent data
- **Etherscan**: Monitor your wallet transactions

## 🔧 **Customization**

### Adjusting Risk Levels
```javascript
// In config.js
riskMultiplier: 0.5,        // 0.5 = half risk, 1.5 = more risk
minScoreThreshold: 80,      // Higher = more conservative
defaultTradeAmount: 0.01,   // Smaller = less risk
```

### Modifying Analysis
Edit `TokenSniperBot.js` to adjust:
- Analysis weights
- Scoring algorithms
- Blacklist criteria
- Emergency conditions

### Custom Strategies
You can implement:
- Custom token filtering
- Advanced profit-taking strategies
- Portfolio rebalancing
- Multi-token correlation analysis

## 🚨 **Safety Features**

### Built-in Protections
- **Rate Limiting**: Max trades per hour
- **Daily Limits**: Maximum daily loss protection
- **Emergency Stop**: Automatic halt on consecutive failures
- **Gas Protection**: Avoids high gas price periods
- **Blacklisting**: Automatically blacklists scam tokens

### Manual Controls
- **Pause Trading**: Temporarily stop all trades
- **Emergency Withdrawal**: Recover funds from contract
- **Blacklist Management**: Add/remove problem tokens
- **Configuration Updates**: Adjust parameters on the fly

## 📈 **Performance Optimization**

### Maximizing Profits
1. **Optimize Timing**: Run during high-activity periods
2. **Gas Management**: Monitor and adjust gas strategies
3. **Parameter Tuning**: Adjust based on performance data
4. **Market Analysis**: Consider overall market conditions

### Reducing Risk
1. **Lower Trade Amounts**: Start small and scale gradually
2. **Stricter Filtering**: Increase minimum score threshold
3. **Faster Selling**: Reduce holding periods
4. **Diversification**: Don't put all funds in one strategy

## 🔍 **Troubleshooting**

### Common Issues

**"Missing required configuration"**
- Check `.env` file exists and has all required variables
- Verify no typos in environment variable names

**"Transaction failed"**
- Check wallet has sufficient ETH for gas
- Verify gas prices aren't too low
- Check if token has trading restrictions

**"No trades executing"**
- Lower `minScoreThreshold` for testing
- Check if bot is properly connected to RPC
- Verify new tokens are being created

**"High gas costs"**
- Adjust `maxGasPrice` in config
- Run during off-peak hours
- Consider Layer 2 solutions

### Getting Help
1. Check console logs for specific error messages
2. Verify all configuration settings
3. Test individual components separately
4. Join developer communities for support

## ⚖️ **Legal and Ethical Considerations**

### Your Responsibilities
- **Legal Compliance**: Ensure compliance with local laws
- **Tax Obligations**: Track and report all trading activity
- **Risk Disclosure**: Understand and accept all risks
- **Ethical Trading**: Avoid manipulative practices

### Best Practices
- **Transparency**: Document your trading strategies
- **Fair Play**: Don't exploit others' mistakes
- **Community**: Contribute positively to the ecosystem
- **Education**: Share knowledge responsibly

## 📞 **Support and Community**

### Resources
- **Documentation**: This guide and code comments
- **Community Forums**: Ethereum and DeFi communities
- **Developer Chat**: Discord/Telegram groups
- **Professional Help**: Consider hiring blockchain developers

### Reporting Issues
If you find bugs or improvements:
1. Document the issue clearly
2. Include relevant logs and configuration
3. Provide steps to reproduce
4. Consider contributing fixes

---

## 🎯 **Quick Start Checklist**

- [ ] Deploy smart contract on testnet
- [ ] Get testnet ETH from faucets
- [ ] Install Node.js and bot dependencies
- [ ] Configure `.env` file with testnet settings
- [ ] Run `NETWORK=testnet npm start`
- [ ] Verify bot analyzes tokens correctly
- [ ] Test a small trade manually
- [ ] Monitor for several hours
- [ ] Deploy smart contract on mainnet
- [ ] Configure mainnet settings with SMALL amounts
- [ ] Run with `npm start`
- [ ] Monitor closely and adjust as needed

**Remember**: Start small, test thoroughly, and never risk more than you can afford to lose!

---

**This is experimental software for educational purposes. Use at your own risk!** 