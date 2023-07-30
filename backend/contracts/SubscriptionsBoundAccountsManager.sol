// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import { SuperAppBaseFlow } from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBaseFlow.sol";
import { ISuperfluid, ISuperToken } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import { SuperTokenV1Library } from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./helpers/OutflowNFT.sol";
import "./interfaces/IERC6551Registry.sol";

contract SubscriptionsBoundAccountsManager is SuperAppBaseFlow, ERC20 {    
    using SuperTokenV1Library for ISuperToken;

    address public _owner;

    IERC6551Registry public registry;
    OutflowNFT public outflowNFT;
    address public sbaImpl;
    ISuperToken public goodDollar; // G$

    int96 public inflowTier1 = 31709791983;   // 1 G$ / year
    int96 public inflowTier42 = 1331811263318; // 42 G$ / year

    uint256 public dappCreditsTier1 = 1 ether;    // 1 CRED
    uint256 public dappCreditsTier42 = 42 ether;  // 42 CRED
    

    constructor() SuperAppBaseFlow(
        ISuperfluid(0xA4Ff07cF81C02CFD356184879D953970cA957585), // host
        true,
        true,
        true
    ) ERC20("DappCredits", "CRED") {
        _owner = msg.sender;
        goodDollar = ISuperToken(0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A);
        registry = IERC6551Registry(0x34e1408B9B047fE12a1B0C655B2D58775AcF579A);
        outflowNFT = OutflowNFT(0xC09c8D5c1F1325ed2D33B1153dC75edf76f080e7);
        sbaImpl = 0x8f8574060f3682408d75a7Fbc86e8e51bc806Fc8;
    }

    // ---------------------------------------------------------------------------------------------
    // SUBSCRIPTION BOUND ACCOUNT LOGIC
    
    function _prepareAccount(
        address owner, 
        uint256 credits, 
        uint256 tokenId
    ) internal {
        // the account wil be bound to this outflowNFT
        outflowNFT.safeMint(owner, tokenId);
        
        // calling the registry and creating the Subscription Bound Account
        address sba = registry.createAccount(
            sbaImpl, // SBA impl
            42220, // chainId
            address(outflowNFT),
            tokenId,
            0, // salt
            bytes('') // initData                
        );
        
        // minting some dapp credits to the SBA according to its subscription tier
        _mint(sba, credits);        
    }  
    
    // compute the outflowNFT tokenID from keccak of sender and receiver
    function _computeTokenId(
        address sender
    ) internal view returns (uint256) {
        return uint256(
            keccak256(
                abi.encodePacked(
                    sender, 
                    address(this)
                )
            )
        );
    }
    
    // calls ERC6551Registry to get the SBA address bound to a tokenId
    function _account(uint256 tokenId) internal view returns (address) {
        return registry.account(
            sbaImpl, // SBA impl
            42220, // chainId
            address(outflowNFT),
            tokenId,
            0 // salt        
        );
    }

    // ---------------------------------------------------------------------------------------------
    // DAPP CREDITS LOGIC    
    
    // allow users to buy more credits to use in the dapp, 1 G$ = 1 credit
    function buyMoreCredits(address sba, uint256 amount) external {
        require(amount != 0, "InvalidAmount");
        
        goodDollar.transferFrom(msg.sender, address(this), amount);
       
        _mint(sba, amount);
    }

    // allow users to spend some credits, test function, must be called from an SBA
    function spendSomeCredits(uint256 amount /*, uint256 action*/) external {
        // Require credits payment here:
        //require(amount >= priceOf(action), "NotEnoughCredits");

        _burn(msg.sender, amount);

        // Apply dapp custom logic here, for example:
        // otherContract.performSomeAction(action, msg.sender);
    }
    
    // ---------------------------------------------------------------------------------------------
    // CALLBACK LOGIC

    function onFlowCreated(
        ISuperToken /*superToken*/,
        address sender,
        bytes calldata ctx
    )
        internal
        override
        returns (bytes memory /*newCtx*/)
    {
        int96 inflowRate = goodDollar.getFlowRate(sender, address(this));
        
        uint256 tokenId = _computeTokenId(sender);

        if (inflowRate >= inflowTier42) {
            _prepareAccount(sender, dappCreditsTier42, tokenId);
        } else if (inflowRate >= inflowTier1) {
            _prepareAccount(sender, dappCreditsTier1, tokenId);
        }

        return ctx;
    }

    function onFlowUpdated(
        ISuperToken /*superToken*/,
        address sender,
        int96 previousFlowRate,
        uint256 /*lastUpdated*/,
        bytes calldata ctx
    )
        internal
        override
        returns (bytes memory /*newCtx*/)
    {

        int96 inflowRate = goodDollar.getFlowRate(sender, address(this));
        
        uint256 tokenId = _computeTokenId(sender);
        
        address SBA = _account(tokenId);

        if (inflowRate >= inflowTier42 && previousFlowRate < inflowTier42) {
             // new tier42 subscription or upgrading from tier1
            if (previousFlowRate >= inflowTier1) {
                // upgrading from tier1
                _mint(SBA, dappCreditsTier42 - dappCreditsTier1);
            } else {
                // new tier42 subscription
                _mint(SBA, dappCreditsTier42);
            }
        } else if (inflowRate >= inflowTier1 && previousFlowRate < inflowTier1) {
            // new tier1 subscription
            _mint(SBA, dappCreditsTier1);
        } else if (inflowRate < inflowTier1 && previousFlowRate >= inflowTier1) {
            // no subscription, inflow under tier1 threshold
            _burn(SBA, balanceOf(SBA));
        } else if (inflowRate < inflowTier42 && previousFlowRate >= inflowTier42) {
            // downgrading from tier42 to tier1
            _burn(SBA, balanceOf(SBA) - dappCreditsTier1);
        }

        return ctx;
    }

    function onFlowDeleted(
        ISuperToken /*superToken*/,
        address sender,
        address /*receiver*/,
        int96 previousFlowRate,
        uint256 /*lastUpdated*/,
        bytes calldata ctx
    )
        internal
        override
        returns (bytes memory /*newCtx*/)
    {
        if (previousFlowRate >= inflowTier1) {
            uint256 tokenId = _computeTokenId(sender);
            address SBA = _account(tokenId);
            
            // burn credits & outflowNFT
            // this make the SBA temporarily useless
            // user will recover access after re-subscribe
            _burn(SBA, balanceOf(SBA));
            outflowNFT.burn(tokenId);
        }
        
        return ctx;
    }
    
    function _beforeTokenTransfer(
        address from, 
        address to, 
        uint256 amount
    ) internal override {
        // ERC20 dapp Credits may be minted or burned.
        // They cannot be exchanged or swapped, so, they remain as dapp credits 
        require(from == address(0) || to == address(0), "Forbbiden");
        super._beforeTokenTransfer(from, to, amount);
    }

    // ---------------------------------------------------------------------------------------------      
    // OWNER SETTINGS

    function setOwner(address owner) external {
        require(msg.sender == _owner);
        _owner = owner;
    }

    function setSBAImpl(address _sbaImpl) external {
        require(msg.sender == _owner);
        sbaImpl = _sbaImpl;
    }

    function setInflowTiers(int96 _inflowTier1, int96 _inflowTier42) external {
        require(msg.sender == _owner);
        inflowTier1 = _inflowTier1;
        inflowTier42 = _inflowTier42;
    }

    function setCreditsTiers(uint256 _creditsTier1, uint256 _creditsTier42) external {
        require(msg.sender == _owner);
        dappCreditsTier1 = _creditsTier1;
        dappCreditsTier42 = _creditsTier42;
    }

    // write more setters if need

    // ---------------------------------------------------------------------------------------------      
    // TREASURY LOGIC

    // Withdraw goodDollar to the dapp owner
    function withdrawG(uint256 amount) external {
        require(goodDollar.balanceOf(address(this)) >= amount);
        goodDollar.transfer(_owner, amount);
    }

    // Revert on receive to avoid locking funds
    receive() external payable {
        require(true == false);
    }
}


