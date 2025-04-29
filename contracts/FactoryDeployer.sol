// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FactoryDeployer {
    // Event to log the deployed contract address
    event Deployed(address indexed addr, bytes32 salt);

    // Deploy a contract using CREATE2
    function deploy(
        bytes memory bytecode,
        bytes32 salt,
        address ownerAddress,
        uint256 initialSupply
    ) public returns (address) {
        // Append constructor arguments to bytecode
        bytes memory initCode = abi.encodePacked(
            bytecode,
            abi.encode(ownerAddress, initialSupply)
        );

        address addr;
        assembly {
            addr := create2(0, add(initCode, 0x20), mload(initCode), salt)
            if iszero(extcodesize(addr)) {
                revert(0, 0)
            }
        }

        emit Deployed(addr, salt);
        return addr;
    }

    // Precompute the CREATE2 address
    function predictDeterministicAddress(
        bytes memory bytecode,
        bytes32 salt,
        address deployer
    ) public pure returns (address) {
        // Compute the creation code hash
        bytes memory initCode = abi.encodePacked(
            bytecode,
            abi.encode(0) // Placeholder for constructor args
        );
        bytes32 initCodeHash = keccak256(initCode);

        // Compute the CREATE2 address
        return
            address(
                uint160(
                    uint256(
                        keccak256(
                            abi.encodePacked(
                                bytes1(0xff),
                                deployer,
                                salt,
                                initCodeHash
                            )
                        )
                    )
                )
            );
    }
}
