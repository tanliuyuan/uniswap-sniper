# Uniswap Sniper - Remix Usage Guide

## 🚨 **IMPORTANT DISCLAIMER**
This smart contract is provided for **educational purposes only**. Automated trading and MEV strategies carry significant financial risks. Always:
- Test on testnets first
- Never invest more than you can afford to lose
- Comply with all applicable laws and regulations
- Consider the ethical implications of your trading strategies

## 📋 **Table of Contents**
1. [Prerequisites](#prerequisites)
2. [Setup in Remix](#setup-in-remix)
3. [Deployment](#deployment)
4. [Configuration](#configuration)
5. [Usage Examples](#usage-examples)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

## 🔧 **Prerequisites**

### Required Tools
- **Remix IDE**: https://remix.ethereum.org/
- **MetaMask**: Browser extension installed and configured
- **ETH**: For gas fees and trading (start with testnet ETH)

### Network Configuration
Make sure MetaMask is connected to your desired network:
- **Ethereum Mainnet**: For live trading
- **Goerli/Sepolia**: For testing

## 🚀 **Setup in Remix**

### Step 1: Import the Contracts
1. Open Remix IDE
2. Create a new workspace or use default
3. Create the following folder structure:
   ```
   remix-contracts/
   ├── contracts/
   │   └── UniswapSniper.sol
   ├── deploy/
   │   └── DeployScript.sol
   └── examples/
       └── UsageExamples.sol
   ```

### Step 2: Install Dependencies
1. Go to the "File Explorer" tab
2. Click on the "Libraries" icon
3. Install OpenZeppelin contracts:
   ```
   npm install @openzeppelin/contracts
   ```

### Step 3: Compile Contracts
1. Go to the "Solidity Compiler" tab
2. Select compiler version `0.8.19` or higher
3. Enable optimization (200 runs recommended)
4. Compile all contracts

## 📦 **Deployment**

### Option 1: Using DeployScript (Recommended)
1. Go to "Deploy & Run Transactions" tab
2. Select your network in MetaMask
3. Select `DeployScript` contract
4. Deploy the script contract
5. Choose appropriate deployment function:
   - `deployForEthereumMainnet()` - For Ethereum mainnet
   - `deployForGoerli()` - For Goerli testnet
   - `deployForSepolia()` - For Sepolia testnet

### Option 2: Direct Deployment
1. Select `UniswapSniper` contract
2. In constructor parameters, enter the router address:
   - **Ethereum**: `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D`
3. Click "Deploy"

## ⚙️ **Configuration**

After deployment, configure your sniper:

### 1. Set Trading Limits
```solidity
// Set max trade amount (e.g., 5 ETH)
setTradeLimits(5000000000000000000, 50000000000000000000)
```

### 2. Configure Slippage
```solidity
// Set max slippage to 3% (300 basis points)
setMaxSlippage(300)
```

### 3. Authorize Traders (Optional)
```solidity
// Authorize an additional wallet
setAuthorizedTrader(0x..., true)
```

### 4. Set Trading Deadline
```solidity
// Set 10-minute deadline
setTradingDeadline(600)
```

## 🎯 **Usage Examples**

### Basic Token Sniping
```solidity
// Snipe 1 ETH worth of tokens with 5% slippage
snipeTokenWithETH{value: 1000000000000000000}(
    0x..., // Token contract address
    500    // 5% slippage (500 basis points)
)
```

### Selling Tokens
```solidity
// First approve the contract to spend your tokens
// Then sell tokens for ETH
sellTokenForETH(
    0x...,  // Token contract address
    amount, // Amount of tokens to sell
    500     // 5% slippage
)
```

### Check Pair Existence
```solidity
// Check if trading pair exists
bool exists = pairExists(tokenAddress, WETH_ADDRESS)
```

### Get Expected Output
```solidity
// Get expected tokens for 1 ETH
uint256 expectedTokens = getExpectedOutput(
    WETH_ADDRESS,
    tokenAddress,
    1000000000000000000 // 1 ETH
)
```

## 🔒 **Security Best Practices**

### 1. Start with Testnets
- Always test on Goerli or Sepolia first
- Use small amounts initially
- Verify all functions work as expected

### 2. Use Reasonable Limits
- Set conservative daily trading limits
- Don't exceed 10% slippage
- Monitor gas prices

### 3. Emergency Controls
```solidity
// Pause trading if needed
pause()

// Emergency stop
setEmergencyStop(true)

// Emergency withdrawal
emergencyWithdraw(tokenAddress, amount)
```

### 4. Monitor Your Trades
- Check transaction history regularly
- Monitor for failed transactions
- Keep track of daily volume

### 5. Access Control
- Only authorize trusted addresses
- Regularly review authorized traders
- Use hardware wallets for owner account

## 🛠 **Troubleshooting**

### Common Issues

**"Pair does not exist"**
- Token hasn't launched yet
- Wrong token address
- No liquidity pool created

**"Exceeds max trade amount"**
- Reduce transaction amount
- Increase limits via `setTradeLimits()`

**"Slippage too high"**
- Market moved significantly
- Reduce slippage tolerance
- Try smaller amounts

**"Insufficient token balance"**
- For selling: You don't own enough tokens
- For buying: Not enough ETH sent

**"Emergency stop activated"**
- Contract is paused for safety
- Contact contract owner
- Check for security issues

### Gas Optimization Tips
- Use appropriate gas price
- Avoid peak network times
- Consider L2 solutions if available
- Batch multiple operations

## 📊 **Monitoring and Analytics**

### Track Your Performance
```solidity
// Get current day's trading volume
uint256 todayVolume = getCurrentDayTradeVolume()

// Check if you're authorized
bool authorized = authorizedTraders[your_address]

// View contract settings
uint256 maxTrade = maxTradeAmount()
uint256 dailyLimit = dailyTradeLimit()
uint256 maxSlip = maxSlippagePercent()
```

### Events to Monitor
- `TradeExecuted`: Successful trades
- `EmergencyWithdraw`: Emergency actions
- `SlippageUpdated`: Setting changes

## ⚠️ **Risk Warnings**

1. **Financial Risk**: You can lose all invested funds
2. **Smart Contract Risk**: Bugs or exploits possible
3. **Market Risk**: Prices can move against you
4. **Gas Risk**: High network fees during congestion
5. **Regulatory Risk**: Laws may change
6. **MEV Risk**: Other bots may front-run your transactions

## 🔗 **Useful Resources**

- [Uniswap Documentation](https://docs.uniswap.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethereum Gas Tracker](https://etherscan.io/gastracker)
- [DeFiPulse](https://defipulse.com/) - For monitoring DeFi protocols

## 📞 **Support**

For technical issues:
1. Check this guide first
2. Review contract code and comments
3. Test on testnets
4. Join relevant developer communities

---

**Remember**: This is experimental software. Use at your own risk and always do your own research! 