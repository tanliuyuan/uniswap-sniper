# Uniswap Sniper Smart Contract

A secure, feature-rich smart contract for automated trading on Uniswap and compatible DEXs. Built with security best practices and designed for use with Remix IDE and MetaMask.

## 🚨 **IMPORTANT DISCLAIMER**
This project is provided for **educational purposes only**. Automated trading carries significant financial risks. Always:
- Test thoroughly on testnets first
- Never invest more than you can afford to lose  
- Comply with all applicable laws and regulations
- Consider the ethical implications of your trading strategies
- Understand that you could lose all your invested funds

## ✨ **Features**

### Core Trading Features
- **ETH to Token Sniping**: Buy tokens immediately when they become available
- **Token to ETH Selling**: Sell tokens back to ETH with slippage protection
- **Pair Existence Checking**: Verify trading pairs exist before attempting trades
- **Price Estimation**: Get expected trade outputs before execution

### Security Features
- **Access Control**: Owner-only and authorized trader functionality
- **Reentrancy Protection**: Prevents reentrancy attacks
- **Slippage Protection**: Configurable slippage limits (max 10%)
- **Trading Limits**: Daily and per-trade amount limits
- **Emergency Controls**: Pause, emergency stop, and emergency withdrawal
- **Input Validation**: Comprehensive input validation on all functions

### Operational Features
- **Multi-Network Support**: Ethereum mainnet and testnets
- **Configurable Parameters**: Adjustable slippage, limits, and deadlines
- **Event Logging**: Comprehensive event emission for monitoring
- **Gas Optimization**: Optimized for efficient gas usage

## 📁 **Project Structure**

```
uniswap-sniper/
├── remix-contracts/               # 📁 Smart Contracts (for Remix IDE)
│   ├── contracts/
│   │   └── UniswapSniper.sol      # Main sniper contract
│   ├── deploy/
│   │   └── DeployScript.sol       # Deployment helper
│   └── examples/
│       └── UsageExamples.sol      # Usage examples
├── local-bot/                     # 📁 Automated Trading Bot (Node.js)
│   ├── TokenSniperBot.js          # Main bot logic
│   ├── config.js                  # Configuration
│   ├── main.js                    # Entry point
│   └── package.json               # Dependencies
├── docs/                          # 📁 Documentation
│   ├── REMIX_USAGE_GUIDE.md       # Remix setup guide
│   ├── BOT_SETUP_GUIDE.md         # Bot installation guide
│   └── SECURITY_CHECKLIST.md      # Security checklist
└── README.md                      # This file
```

## 🚀 **Quick Start**

### 1. Prerequisites
- [Remix IDE](https://remix.ethereum.org/) - For smart contract deployment
- [Node.js](https://nodejs.org/) 14+ - For running the automated bot
- MetaMask browser extension
- Test ETH (get from faucets for testnets)

### 2. Setup in Remix
1. Open Remix IDE
2. Create a new workspace
3. Import only the `remix-contracts/` folder contents
4. Install OpenZeppelin contracts: `npm install @openzeppelin/contracts`
5. Compile contracts with Solidity 0.8.19+

### 3. Deploy
```solidity
// For Ethereum Mainnet
address router = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
UniswapSniper sniper = new UniswapSniper(router);

// Or use DeployScript for easier deployment
DeployScript deployer = new DeployScript();
address sniperAddress = deployer.deployForEthereumMainnet();
```

### 4. Configure
```solidity
// Set trading limits (5 ETH max per trade, 50 ETH daily)
sniper.setTradeLimits(5 ether, 50 ether);

// Set 3% max slippage
sniper.setMaxSlippage(300);

// Authorize additional traders (optional)
sniper.setAuthorizedTrader(0x..., true);
```

### 5. Setup Automated Bot
```bash
# Navigate to bot directory
cd local-bot/

# Install dependencies
npm install

# Configure environment variables (.env file)
# Add your private key, RPC URL, and contract address

# Start the bot (testnet first!)
NETWORK=testnet npm start
```

### 6. Manual Trading (Optional)
```solidity
// You can also trade manually through Remix:
sniper.snipeTokenWithETH{value: 1 ether}(tokenAddress, 500);
bool exists = sniper.pairExists(tokenAddress, wethAddress);
```

## 📖 **Detailed Documentation**

- **[Remix Usage Guide](docs/REMIX_USAGE_GUIDE.md)**: Complete guide for using the contracts in Remix
- **[Bot Setup Guide](docs/BOT_SETUP_GUIDE.md)**: Step-by-step bot installation and configuration
- **[Security Checklist](docs/SECURITY_CHECKLIST.md)**: Comprehensive security review checklist
- **[Usage Examples](remix-contracts/examples/UsageExamples.sol)**: Code examples for common use cases

## 🔒 **Security Features**

### Built-in Protections
- **Reentrancy Guard**: Prevents recursive calls
- **Access Control**: Only authorized addresses can trade
- **Pausable**: Emergency pause functionality
- **Slippage Limits**: Maximum 10% slippage protection
- **Trading Limits**: Configurable daily and per-trade limits
- **Emergency Stop**: Circuit breaker for immediate halt

### Best Practices Implemented
- OpenZeppelin standard contracts
- Comprehensive input validation
- Clear error messages
- Event emission for all major actions
- Gas-optimized code
- Detailed documentation

## 🌐 **Supported Networks**

| Network | Router Address | Notes |
|---------|---------------|-------|
| Ethereum Mainnet | `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D` | Uniswap V2 |
| Ethereum Goerli | `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D` | Uniswap V2 Testnet |
| Ethereum Sepolia | `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D` | Uniswap V2 Testnet |

## ⚠️ **Risk Warnings**

1. **Smart Contract Risk**: Bugs or vulnerabilities could lead to loss of funds
2. **Market Risk**: Token prices can be highly volatile
3. **Slippage Risk**: Actual prices may differ from expected prices
4. **Gas Risk**: High network congestion can make trades expensive
5. **Regulatory Risk**: Regulations may change affecting legality
6. **MEV Risk**: Other bots may front-run your transactions

## 🔄 **Complete Workflow**

This project consists of **two components** that work together:

### **Phase 1: Smart Contract (Remix IDE)**
```bash
1. Import remix-contracts/ folder into Remix
2. Compile and deploy UniswapSniper.sol
3. Configure contract settings (trading limits, slippage)
4. Copy deployed contract address
```

### **Phase 2: Automated Bot (Your Computer)**
```bash
1. cd local-bot/
2. npm install
3. Configure .env with contract address from Phase 1
4. npm start
```

### **How They Connect**
- **Smart Contract**: Handles secure trading execution on-chain
- **Bot**: Monitors blockchain, analyzes tokens, calls contract
- **Connection**: Bot sends transactions to your deployed contract

## 🛠 **Development**

### Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/uniswap-sniper.git
cd uniswap-sniper

# For contracts: Import remix-contracts/ into Remix IDE
# For bot: cd local-bot/ && npm install
```

### Testing
- **Smart Contract**: Deploy on Goerli testnet through Remix first
- **Bot Setup**: Run bot with `NETWORK=testnet npm start`
- **Integration**: Test bot → contract communication
- **Start Small**: Use minimal amounts (0.01 ETH)
- **Monitor**: Watch logs and transaction success

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📊 **Monitoring**

### Key Metrics to Track
- Daily trading volume
- Success/failure rates
- Gas consumption
- Slippage experienced
- Profit/loss per trade

### Events to Monitor
- `TradeExecuted`: Successful trades
- `EmergencyWithdraw`: Emergency actions
- `SlippageUpdated`: Parameter changes

## 🔗 **Useful Resources**

- [Uniswap Documentation](https://docs.uniswap.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Remix IDE](https://remix.ethereum.org/)
- [MetaMask](https://metamask.io/)
- [Ethereum Gas Tracker](https://etherscan.io/gastracker)

## 📞 **Support**

For technical issues:
1. Check the documentation first
2. Review the security checklist
3. Test on testnets
4. Join relevant developer communities

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚖️ **Legal Notice**

This software is provided "as is" without warranty of any kind. Users are responsible for:
- Compliance with applicable laws and regulations
- Understanding the risks involved
- Proper security practices
- Ethical use of the technology

**Remember**: This is experimental software for educational purposes. Use at your own risk and always do your own research!