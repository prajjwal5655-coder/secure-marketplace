// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SecureMarket is ReentrancyGuard {

struct Item {
    uint256 id;
    address payable seller;
    address payable buyer;
    string title;
    uint256 price;
    ItemState state;
}

enum ItemState { Available, LockedInEscrow, Completed, Disputed }

uint256 public itemCounter;
address public platformOwner;

mapping(uint256 => Item) public items;

event ItemListed(uint256 indexed id, address indexed seller, string title, uint256 price);
event PaymentLocked(uint256 indexed id, address indexed buyer);
event PaymentReleased(uint256 indexed id, address indexed seller);

constructor() {
    platformOwner = msg.sender;
}

function listItem(string memory _title, uint256 _price) external {
    require(_price > 0, "Price must be greater than 0");
    
    itemCounter++;
    items[itemCounter] = Item({
        id: itemCounter,
        seller: payable(msg.sender),
        buyer: payable(address(0)),
        title: _title,
        price: _price,
        state: ItemState.Available
    });

    emit ItemListed(itemCounter, msg.sender, _title, _price);
}

function purchaseItem(uint256 _id) external payable nonReentrant {
    Item storage item = items[_id];
    require(item.state == ItemState.Available, "Item not available");
    require(msg.value == item.price, "Exact price must be paid");
    require(msg.sender != item.seller, "Seller cannot buy own item");

    item.buyer = payable(msg.sender);
    item.state = ItemState.LockedInEscrow;

    emit PaymentLocked(_id, msg.sender);
}

function confirmReceipt(uint256 _id) external nonReentrant {
    Item storage item = items[_id];
    require(item.state == ItemState.LockedInEscrow, "Item not in escrow");
    require(msg.sender == item.buyer, "Only buyer can confirm receipt");

    item.state = ItemState.Completed;
    
    (bool success, ) = item.seller.call{value: item.price}("");
    require(success, "Transfer failed");

    emit PaymentReleased(_id, item.seller);
}


}