// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/UniswapSniper.sol";

/**
 * @title UsageExamples
 * @dev Example usage patterns for the UniswapSniper contract
 * @notice These examples show how to safely interact with the sniper contract
 */
contract UsageExamples {
    UniswapSniper public sniper;
    
    // Token addresses on Ethereum - VERIFY THESE BEFORE USE
    address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    
    constructor(address _sniperAddress) {
        sniper = UniswapSniper(_sniperAddress);
    }
    
    /**
     * @dev Example: Snipe a token with 3% slippage
     * @param tokenAddress Token to buy
     */
    function exampleSnipeToken(address tokenAddress) external payable {
        require(msg.value > 0, "Must send ETH");
        
        // Check if pair exists before sniping
        require(sniper.pairExists(tokenAddress, WETH), "Pair doesn't exist");
        
        // Get expected output to verify reasonable pricing
        uint256 expectedOutput = sniper.getExpectedOutput(WETH, tokenAddress, msg.value);
        require(expectedOutput > 0, "No liquidity available");
        
        // Execute snipe with 3% slippage (300 basis points)
        sniper.snipeTokenWithETH{value: msg.value}(tokenAddress, 300);
    }
    
    /**
     * @dev Example: Sell tokens with 5% slippage
     * @param tokenAddress Token to sell
     * @param amount Amount to sell
     */
    function exampleSellToken(address tokenAddress, uint256 amount) external {
        // First approve this contract to transfer tokens
        IERC20(tokenAddress).approve(address(this), amount);
        
        // Then approve the sniper contract
        IERC20(tokenAddress).approve(address(sniper), amount);
        
        // Get expected ETH output
        uint256 expectedETH = sniper.getExpectedOutput(tokenAddress, WETH, amount);
        require(expectedETH > 0, "No liquidity for sale");
        
        // Execute sale with 5% slippage (500 basis points)
        sniper.sellTokenForETH(tokenAddress, amount, 500);
    }
    
    /**
     * @dev Example: Check trading limits before executing
     */
    function checkTradingLimits(uint256 ethAmount) external view returns (bool canTrade, string memory reason) {
        // Check max trade amount
        if (ethAmount > sniper.maxTradeAmount()) {
            return (false, "Exceeds max trade amount");
        }
        
        // Check daily limit
        uint256 currentDayVolume = sniper.getCurrentDayTradeVolume();
        if (currentDayVolume + ethAmount > sniper.dailyTradeLimit()) {
            return (false, "Would exceed daily trade limit");
        }
        
        return (true, "Trade allowed");
    }
    
    /**
     * @dev Example: Safe snipe with all checks
     * @param tokenAddress Token to buy
     * @param maxSlippage Maximum slippage to accept (basis points)
     */
    function safeSnipe(address tokenAddress, uint256 maxSlippage) external payable {
        // 1. Check if we can trade this amount
        (bool canTrade, string memory reason) = checkTradingLimits(msg.value);
        require(canTrade, reason);
        
        // 2. Verify pair exists
        require(sniper.pairExists(tokenAddress, WETH), "Trading pair doesn't exist");
        
        // 3. Check if slippage is reasonable
        require(maxSlippage <= 1000, "Slippage too high (max 10%)");
        
        // 4. Get expected output and verify it's reasonable
        uint256 expectedTokens = sniper.getExpectedOutput(WETH, tokenAddress, msg.value);
        require(expectedTokens > 0, "No liquidity or invalid pair");
        
        // 5. Execute the snipe
        sniper.snipeTokenWithETH{value: msg.value}(tokenAddress, maxSlippage);
    }
    
    /**
     * @dev Example: Monitor a token and auto-snipe when liquidity appears
     * @param targetToken Token to monitor
     * @param purchaseAmount Amount of ETH to spend
     * @param slippage Slippage tolerance
     */
    function monitorAndSnipe(
        address targetToken,
        uint256 purchaseAmount,
        uint256 slippage
    ) external {
        // Check if pair exists
        if (!sniper.pairExists(targetToken, WETH)) {
            revert("Pair not yet created");
        }
        
        // Check if there's sufficient liquidity
        try sniper.getExpectedOutput(WETH, targetToken, purchaseAmount) returns (uint256 expectedOutput) {
            if (expectedOutput == 0) {
                revert("No liquidity available");
            }
            
            // If we reach here, pair exists and has liquidity
            // Execute the snipe (requires ETH to be sent with transaction)
            sniper.snipeTokenWithETH{value: purchaseAmount}(targetToken, slippage);
        } catch {
            revert("Failed to get price - insufficient liquidity");
        }
    }
    
    /**
     * @dev Example: Batch check multiple tokens
     * @param tokens Array of token addresses to check
     * @return results Array of booleans indicating which pairs exist
     */
    function batchCheckPairs(address[] calldata tokens) 
        external 
        view 
        returns (bool[] memory results) 
    {
        results = new bool[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            results[i] = sniper.pairExists(tokens[i], WETH);
        }
    }
    
    /**
     * @dev Emergency function to withdraw any stuck ETH
     */
    function emergencyWithdrawETH() external {
        require(msg.sender == sniper.owner(), "Only sniper owner");
        payable(msg.sender).transfer(address(this).balance);
    }
    
    // Receive function to accept ETH
    receive() external payable {}
} 