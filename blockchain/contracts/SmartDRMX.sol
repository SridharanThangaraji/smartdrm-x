// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SmartDRMX {

    struct Asset {
        address owner;
        string assetHash;
        uint256 createdAt;
        bool transferable;
    }

    struct License {
        uint256 expiryTime;
        uint256 accessLimit;
        uint256 accessUsed;
        bool active;
    }

    uint256 public assetCount;

    mapping(uint256 => Asset) public assets;
    mapping(uint256 => mapping(address => License)) public licenses;

    event AssetRegistered(uint256 assetId, address owner, string assetHash);
    event LicenseIssued(uint256 assetId, address user);
    event AccessGranted(uint256 assetId, address user);
    event OwnershipTransferred(uint256 assetId, address newOwner);

    // 🔐 Register digital asset
    function registerAsset(string memory _assetHash, bool _transferable) public {
        assetCount++;

        assets[assetCount] = Asset({
            owner: msg.sender,
            assetHash: _assetHash,
            createdAt: block.timestamp,
            transferable: _transferable
        });

        emit AssetRegistered(assetCount, msg.sender, _assetHash);
    }

    // 📜 Issue license
    function issueLicense(
        uint256 _assetId,
        address _user,
        uint256 _expiryTime,
        uint256 _accessLimit
    ) public {
        require(msg.sender == assets[_assetId].owner, "Not asset owner");

        licenses[_assetId][_user] = License({
            expiryTime: _expiryTime,
            accessLimit: _accessLimit,
            accessUsed: 0,
            active: true
        });

        emit LicenseIssued(_assetId, _user);
    }

    // ✅ Request access
    function requestAccess(uint256 _assetId) public returns (bool) {
        License storage lic = licenses[_assetId][msg.sender];

        require(lic.active, "No active license");
        require(block.timestamp < lic.expiryTime, "License expired");
        require(lic.accessUsed < lic.accessLimit, "Access limit exceeded");

        lic.accessUsed++;

        emit AccessGranted(_assetId, msg.sender);
        return true;
    }

    // 🔁 Transfer ownership
    function transferOwnership(uint256 _assetId, address _newOwner) public {
        require(msg.sender == assets[_assetId].owner, "Not owner");
        require(assets[_assetId].transferable, "Asset non-transferable");

        assets[_assetId].owner = _newOwner;

        emit OwnershipTransferred(_assetId, _newOwner);
    }
}
