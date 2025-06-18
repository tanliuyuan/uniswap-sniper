// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/UniswapSniper.sol";

/**
 * @title DeployScript
 * @dev Deployment script for UniswapSniper contract on Uniswap V2
 * @notice Use this script in Remix to deploy the contract with correct Uniswap router addresses
 */
contract DeployScript {
    // Uniswap V2 Router addresses for different networks
    address public constant ETHEREUM_MAINNET_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address public constant ETHEREUM_GOERLI_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address public constant ETHEREUM_SEPOLIA_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    
    event ContractDeployed(address indexed contractAddress, address indexed router, string network);
    
    /**
     * @dev Deploy UniswapSniper for Ethereum Mainnet
     * @return Address of deployed contract
     */
    function deployForEthereumMainnet() external returns (address) {
        UniswapSniper sniper = new UniswapSniper(ETHEREUM_MAINNET_ROUTER);
        emit ContractDeployed(address(sniper), ETHEREUM_MAINNET_ROUTER, "Ethereum Mainnet");
        return address(sniper);
    }
    
    /**
     * @dev Deploy UniswapSniper for Ethereum Goerli Testnet
     * @return Address of deployed contract
     */
    function deployForGoerli() external returns (address) {
        UniswapSniper sniper = new UniswapSniper(ETHEREUM_GOERLI_ROUTER);
        emit ContractDeployed(address(sniper), ETHEREUM_GOERLI_ROUTER, "Ethereum Goerli");
        return address(sniper);
    }
    
    /**
     * @dev Deploy UniswapSniper for Ethereum Sepolia Testnet
     * @return Address of deployed contract
     */
    function deployForSepolia() external returns (address) {
        UniswapSniper sniper = new UniswapSniper(ETHEREUM_SEPOLIA_ROUTER);
        emit ContractDeployed(address(sniper), ETHEREUM_SEPOLIA_ROUTER, "Ethereum Sepolia");
        return address(sniper);
    }
    

    
    /**
     * @dev Deploy UniswapSniper with custom router address
     * @param routerAddress Custom router address
     * @return Address of deployed contract
     */
    function deployWithCustomRouter(address routerAddress) external returns (address) {
        require(routerAddress != address(0), "Invalid router address");
        UniswapSniper sniper = new UniswapSniper(routerAddress);
        emit ContractDeployed(address(sniper), routerAddress, "Custom Network");
        return address(sniper);
    }
} 