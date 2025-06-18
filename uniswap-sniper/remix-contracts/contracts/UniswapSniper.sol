// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IUniswapV2Router02 {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);
    
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
    
    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function getAmountsOut(uint amountIn, address[] calldata path)
        external view returns (uint[] memory amounts);
}

interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

/**
 * @title UniswapSniper
 * @dev Automated trading contract specifically for Uniswap V2 with comprehensive security features
 * @notice This contract implements legitimate automated trading strategies on Uniswap
 * WARNING: This is for educational purposes. Always comply with applicable laws and regulations.
 */
contract UniswapSniper is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    // Events
    event TradeExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address indexed trader
    );
    
    event EmergencyWithdraw(address indexed token, uint256 amount);
    event SlippageUpdated(uint256 oldSlippage, uint256 newSlippage);
    event RouterUpdated(address indexed oldRouter, address indexed newRouter);
    
    // State variables
    IUniswapV2Router02 public uniswapRouter;
    IUniswapV2Factory public uniswapFactory;
    
    // Security parameters
    uint256 public maxSlippagePercent = 500; // 5% max slippage (500/10000)
    uint256 public constant MAX_SLIPPAGE_LIMIT = 1000; // 10% absolute max
    uint256 public tradingDeadline = 300; // 5 minutes default
    
    // Trading limits
    uint256 public maxTradeAmount = 10 ether; // Max 10 ETH per trade
    uint256 public dailyTradeLimit = 100 ether; // Max 100 ETH per day
    
    // Daily tracking
    mapping(uint256 => uint256) public dailyTradeVolume; // day => volume
    
    // Authorized traders (for additional security layer)
    mapping(address => bool) public authorizedTraders;
    
    // Circuit breaker
    bool public emergencyStop = false;
    
    modifier onlyAuthorized() {
        require(authorizedTraders[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier notEmergency() {
        require(!emergencyStop, "Emergency stop activated");
        _;
    }
    
    modifier validSlippage(uint256 _slippage) {
        require(_slippage <= MAX_SLIPPAGE_LIMIT, "Slippage too high");
        _;
    }
    
    modifier withinTradeLimit(uint256 _amount) {
        require(_amount <= maxTradeAmount, "Exceeds max trade amount");
        
        uint256 today = block.timestamp / 86400; // Current day
        require(
            dailyTradeVolume[today] + _amount <= dailyTradeLimit,
            "Exceeds daily trade limit"
        );
        _;
    }
    
    constructor(address _uniswapRouter) {
        require(_uniswapRouter != address(0), "Invalid router address");
        
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        uniswapFactory = IUniswapV2Factory(uniswapRouter.factory());
        
        // Owner is automatically authorized
        authorizedTraders[msg.sender] = true;
    }
    
    /**
     * @dev Snipe a token by buying with ETH
     * @param tokenAddress The token to buy
     * @param slippagePercent Custom slippage for this trade (basis points)
     */
    function snipeTokenWithETH(
        address tokenAddress,
        uint256 slippagePercent
    ) 
        external 
        payable 
        onlyAuthorized 
        nonReentrant 
        whenNotPaused 
        notEmergency
        validSlippage(slippagePercent)
        withinTradeLimit(msg.value)
    {
        require(msg.value > 0, "Must send ETH");
        require(tokenAddress != address(0), "Invalid token address");
        require(tokenAddress != uniswapRouter.WETH(), "Cannot snipe WETH");
        
        // Check if pair exists
        address pair = uniswapFactory.getPair(tokenAddress, uniswapRouter.WETH());
        require(pair != address(0), "Pair does not exist");
        
        // Calculate minimum tokens to receive
        address[] memory path = new address[](2);
        path[0] = uniswapRouter.WETH();
        path[1] = tokenAddress;
        
        uint256[] memory amountsOut = uniswapRouter.getAmountsOut(msg.value, path);
        uint256 amountOutMin = amountsOut[1] * (10000 - slippagePercent) / 10000;
        
        // Execute swap
        uint256[] memory amounts = uniswapRouter.swapExactETHForTokens{value: msg.value}(
            amountOutMin,
            path,
            msg.sender, // Send tokens directly to caller
            block.timestamp + tradingDeadline
        );
        
        // Update daily volume
        uint256 today = block.timestamp / 86400;
        dailyTradeVolume[today] += msg.value;
        
        emit TradeExecuted(
            uniswapRouter.WETH(),
            tokenAddress,
            msg.value,
            amounts[1],
            msg.sender
        );
    }
    
    /**
     * @dev Sell tokens for ETH
     * @param tokenAddress The token to sell
     * @param tokenAmount Amount of tokens to sell
     * @param slippagePercent Custom slippage for this trade (basis points)
     */
    function sellTokenForETH(
        address tokenAddress,
        uint256 tokenAmount,
        uint256 slippagePercent
    )
        external
        onlyAuthorized
        nonReentrant
        whenNotPaused
        notEmergency
        validSlippage(slippagePercent)
    {
        require(tokenAmount > 0, "Amount must be greater than 0");
        require(tokenAddress != address(0), "Invalid token address");
        require(tokenAddress != uniswapRouter.WETH(), "Cannot sell WETH directly");
        
        IERC20 token = IERC20(tokenAddress);
        require(token.balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");
        
        // Transfer tokens from caller to this contract
        token.safeTransferFrom(msg.sender, address(this), tokenAmount);
        
        // Approve router to spend tokens
        token.safeApprove(address(uniswapRouter), tokenAmount);
        
        // Calculate minimum ETH to receive
        address[] memory path = new address[](2);
        path[0] = tokenAddress;
        path[1] = uniswapRouter.WETH();
        
        uint256[] memory amountsOut = uniswapRouter.getAmountsOut(tokenAmount, path);
        uint256 amountOutMin = amountsOut[1] * (10000 - slippagePercent) / 10000;
        
        // Execute swap
        uint256[] memory amounts = uniswapRouter.swapExactTokensForETH(
            tokenAmount,
            amountOutMin,
            path,
            msg.sender, // Send ETH directly to caller
            block.timestamp + tradingDeadline
        );
        
        emit TradeExecuted(
            tokenAddress,
            uniswapRouter.WETH(),
            tokenAmount,
            amounts[1],
            msg.sender
        );
    }
    
    /**
     * @dev Get expected output amount for a trade
     * @param tokenIn Input token address
     * @param tokenOut Output token address  
     * @param amountIn Input amount
     * @return Expected output amount
     */
    function getExpectedOutput(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        uint256[] memory amountsOut = uniswapRouter.getAmountsOut(amountIn, path);
        return amountsOut[1];
    }
    
    /**
     * @dev Check if a token pair exists
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return True if pair exists
     */
    function pairExists(address tokenA, address tokenB) external view returns (bool) {
        return uniswapFactory.getPair(tokenA, tokenB) != address(0);
    }
    
    // Admin functions
    
    /**
     * @dev Add or remove authorized trader
     * @param trader Trader address
     * @param authorized True to authorize, false to revoke
     */
    function setAuthorizedTrader(address trader, bool authorized) external onlyOwner {
        require(trader != address(0), "Invalid trader address");
        authorizedTraders[trader] = authorized;
    }
    
    /**
     * @dev Update max slippage percentage
     * @param _slippagePercent New slippage percentage (basis points)
     */
    function setMaxSlippage(uint256 _slippagePercent) external onlyOwner validSlippage(_slippagePercent) {
        emit SlippageUpdated(maxSlippagePercent, _slippagePercent);
        maxSlippagePercent = _slippagePercent;
    }
    
    /**
     * @dev Update trading deadline
     * @param _deadline New deadline in seconds
     */
    function setTradingDeadline(uint256 _deadline) external onlyOwner {
        require(_deadline >= 60 && _deadline <= 3600, "Deadline must be between 1 minute and 1 hour");
        tradingDeadline = _deadline;
    }
    
    /**
     * @dev Update trade limits
     * @param _maxTradeAmount New max trade amount
     * @param _dailyTradeLimit New daily trade limit
     */
    function setTradeLimits(uint256 _maxTradeAmount, uint256 _dailyTradeLimit) external onlyOwner {
        require(_maxTradeAmount > 0 && _dailyTradeLimit > 0, "Limits must be greater than 0");
        require(_dailyTradeLimit >= _maxTradeAmount, "Daily limit must be >= max trade");
        
        maxTradeAmount = _maxTradeAmount;
        dailyTradeLimit = _dailyTradeLimit;
    }
    
    /**
     * @dev Update Uniswap router (for upgrades)
     * @param _newRouter New router address
     */
    function setRouter(address _newRouter) external onlyOwner {
        require(_newRouter != address(0), "Invalid router address");
        emit RouterUpdated(address(uniswapRouter), _newRouter);
        
        uniswapRouter = IUniswapV2Router02(_newRouter);
        uniswapFactory = IUniswapV2Factory(uniswapRouter.factory());
    }
    
    /**
     * @dev Emergency stop/resume
     * @param _stop True to stop, false to resume
     */
    function setEmergencyStop(bool _stop) external onlyOwner {
        emergencyStop = _stop;
    }
    
    /**
     * @dev Pause/unpause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdrawal function
     * @param token Token address (address(0) for ETH)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            // Withdraw ETH
            require(address(this).balance >= amount, "Insufficient ETH balance");
            payable(owner()).transfer(amount);
        } else {
            // Withdraw ERC20 token
            IERC20(token).safeTransfer(owner(), amount);
        }
        
        emit EmergencyWithdraw(token, amount);
    }
    
    /**
     * @dev Get current day's trade volume
     * @return Current day's trade volume
     */
    function getCurrentDayTradeVolume() external view returns (uint256) {
        uint256 today = block.timestamp / 86400;
        return dailyTradeVolume[today];
    }
    
    // Fallback functions
    receive() external payable {}
    
    fallback() external payable {}
} 