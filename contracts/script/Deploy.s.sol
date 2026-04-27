// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {BountyEscrow} from "../src/BountyEscrow.sol";

contract Deploy is Script {
    function run() external {
        address usdt = vm.envAddress("KITE_USDT_ADDRESS");
        address broker = vm.envAddress("BROKER_ADDRESS");
        address treasury = vm.envAddress("PLATFORM_TREASURY_ADDRESS");

        vm.startBroadcast();

        BountyEscrow escrow = new BountyEscrow(IERC20(usdt), broker, treasury);
        console.log("BountyEscrow deployed at:", address(escrow));
        console.log("  USDT:", usdt);
        console.log("  Broker:", broker);
        console.log("  Treasury:", treasury);

        vm.stopBroadcast();
    }
}
