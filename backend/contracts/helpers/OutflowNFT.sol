// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OutflowNFT is ERC721, Ownable {
    constructor() ERC721("OutflowNFT", "OUTF") {
        _transferOwnership(msg.sender);
    }

    function safeMint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }
    
    function burn(uint256 tokenId) public onlyOwner {
        _burn(tokenId);
    }
}

