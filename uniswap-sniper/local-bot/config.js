/**
 * Configuration file for TokenSniperBot
 * 
 * ⚠️ SECURITY WARNING:
 * - Never commit your private key to version control
 * - Use environment variables for sensitive data
 * - Test with small amounts first
 */

const config = {
    // Network Configuration
    networkName: "ethereum_mainnet", // or "ethereum_goerli" for testing
    rpcUrl: process.env.RPC_URL || "https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY",
    
    // Wallet Configuration (⚠️ KEEP PRIVATE!)
    privateKey: process.env.PRIVATE_KEY || "YOUR_PRIVATE_KEY_HERE",
    
    // Contract Addresses
    sniperAddress: process.env.SNIPER_ADDRESS || "YOUR_DEPLOYED_SNIPER_CONTRACT",
    uniswapFactory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    uniswapRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    wethAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    
    // Trading Parameters
    defaultTradeAmount: 0.1,        // ETH amount per trade
    maxTradeAmount: 1.0,            // Maximum ETH per single trade
    minLiquidityETH: 0.5,           // Minimum liquidity required (ETH)
    maxLiquidityETH: 50.0,          // Maximum liquidity (avoid whale traps)
    defaultSlippage: 500,           // 5% slippage (500 basis points)
    maxTradesPerHour: 10,           // Rate limiting
    
    // Risk Management
    minScoreThreshold: 70,          // Minimum analysis score percentage
    riskMultiplier: 0.8,            // Conservative multiplier (0.5 = half risk, 1.5 = more risk)
    
    // Sell Strategy
    sellStrategy: {
        delayMs: 300000,            // Wait 5 minutes before selling
        percentage: 80,             // Sell 80% of holdings
        slippage: 800,              // 8% slippage for sells
        stopLossPercentage: -50,    // Emergency sell if down 50%
        takeProfitPercentage: 200   // Auto-sell if up 200%
    },
    
    // Analysis Weights (Advanced)
    analysisWeights: {
        liquidity: 0.3,
        ownership: 0.25,
        contract: 0.2,
        timing: 0.15,
        market: 0.1
    },
    
    // Gas Configuration
    gasConfig: {
        maxGasPrice: 100,           // Max gas price in Gwei
        gasLimit: 300000,           // Gas limit for transactions
        gasPremiumPercent: 10       // Extra gas for speed
    },
    
    // Monitoring Configuration
    monitoring: {
        logInterval: 60000,         // Log stats every minute
        saveInterval: 600000,       // Save data every 10 minutes
        positionCheckInterval: 30000 // Check positions every 30 seconds
    },
    
    // Safety Features
    safety: {
        maxDailyLoss: 5.0,          // Stop if losing more than 5 ETH per day
        maxConsecutiveFails: 5,     // Stop after 5 consecutive failures
        emergencyStopLoss: -80,     // Emergency stop if portfolio down 80%
        requireConfirmation: false   // Set to true for manual approval of trades
    }
};

// Testnet configuration
const testnetConfig = {
    ...config,
    networkName: "ethereum_goerli",
    rpcUrl: process.env.GOERLI_RPC_URL || "https://eth-goerli.alchemyapi.io/v2/YOUR_API_KEY",
    defaultTradeAmount: 0.01,       // Smaller amounts for testing
    maxTradeAmount: 0.1,
    minLiquidityETH: 0.01,
    maxLiquidityETH: 5.0,
    minScoreThreshold: 50           // Lower threshold for testing
};

// Contract ABIs (Essential functions only)
const sniperABI = [
    "function snipeTokenWithETH(address tokenAddress, uint256 slippagePercent) external payable",
    "function sellTokenForETH(address tokenAddress, uint256 tokenAmount, uint256 slippagePercent) external",
    "function getExpectedOutput(address tokenIn, address tokenOut, uint256 amountIn) external view returns (uint256)",
    "function pairExists(address tokenA, address tokenB) external view returns (bool)",
    "function maxTradeAmount() external view returns (uint256)",
    "function dailyTradeLimit() external view returns (uint256)",
    "function getCurrentDayTradeVolume() external view returns (uint256)",
    "event TradeExecuted(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, address indexed trader)"
];

const factoryABI = [
    "event PairCreated(address indexed token0, address indexed token1, address pair, uint)",
    "function getPair(address tokenA, address tokenB) external view returns (address pair)"
];

const routerABI = [
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)"
];

const erc20ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)", 
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)"
];

// Export configuration
module.exports = {
    mainnet: {
        ...config,
        sniperABI,
        factoryABI,
        routerABI,
        erc20ABI
    },
    testnet: {
        ...testnetConfig,
        sniperABI,
        factoryABI,
        routerABI,
        erc20ABI
    }
};

// Environment validation
function validateConfig(cfg) {
    const required = ['privateKey', 'sniperAddress', 'rpcUrl'];
    const missing = required.filter(key => !cfg[key] || cfg[key].includes('YOUR_'));
    
    if (missing.length > 0) {
        console.error("❌ Missing required configuration:");
        missing.forEach(key => console.error(`   - ${key}`));
        console.error("\n🔧 Please update config.js or set environment variables");
        process.exit(1);
    }
}

// Validate configuration on import
if (process.env.NODE_ENV !== 'test') {
    const activeConfig = process.env.NETWORK === 'testnet' ? testnetConfig : config;
    validateConfig(activeConfig);
} 