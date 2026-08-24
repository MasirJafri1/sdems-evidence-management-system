// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {
    AccessControl
} from "@openzeppelin/contracts/access/AccessControl.sol";

contract EvidenceRegistry is AccessControl {

    bytes32 public constant ANCHOR_ROLE =
        keccak256("ANCHOR_ROLE");

    struct EvidenceAnchor {
        bytes32 caseIdHash;
        bytes32 documentIdHash;
        bytes32 contentHash;

        uint64 version;
        uint64 anchoredAt;

        address anchoredBy;
    }

    mapping(
        bytes32 => EvidenceAnchor
    ) private anchors;

    mapping(
        bytes32 => bool
    ) private anchorExists;

    event EvidenceAnchored(
        bytes32 indexed anchorId,
        bytes32 indexed caseIdHash,
        bytes32 indexed documentIdHash,
        bytes32 contentHash,
        uint64 version,
        uint64 anchoredAt,
        address anchoredBy
    );

    error AnchorAlreadyExists(
        bytes32 anchorId
    );

    error AnchorDoesNotExist(
        bytes32 anchorId
    );

    constructor(
        address admin
    ) {

        _grantRole(
            DEFAULT_ADMIN_ROLE,
            admin
        );

        _grantRole(
            ANCHOR_ROLE,
            admin
        );
    }

    function computeAnchorId(
        bytes32 caseIdHash,
        bytes32 documentIdHash,
        uint64 version
    )
        public
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                caseIdHash,
                documentIdHash,
                version
            )
        );
    }

    function anchorEvidence(
        bytes32 caseIdHash,
        bytes32 documentIdHash,
        bytes32 contentHash,
        uint64 version
    )
        external
        onlyRole(ANCHOR_ROLE)
        returns (bytes32 anchorId)
    {

        anchorId =
            computeAnchorId(
                caseIdHash,
                documentIdHash,
                version
            );

        if (
            anchorExists[anchorId]
        ) {
            revert AnchorAlreadyExists(
                anchorId
            );
        }

        uint64 timestamp =
            uint64(
                block.timestamp
            );

        anchors[anchorId] =
            EvidenceAnchor({
                caseIdHash:
                    caseIdHash,

                documentIdHash:
                    documentIdHash,

                contentHash:
                    contentHash,

                version:
                    version,

                anchoredAt:
                    timestamp,

                anchoredBy:
                    msg.sender
            });

        anchorExists[
            anchorId
        ] = true;

        emit EvidenceAnchored(
            anchorId,
            caseIdHash,
            documentIdHash,
            contentHash,
            version,
            timestamp,
            msg.sender
        );
    }

    function getAnchor(
        bytes32 anchorId
    )
        external
        view
        returns (
            EvidenceAnchor memory anchor,
            bool isFound
        )
    {
        return (
            anchors[anchorId],
            anchorExists[anchorId]
        );
    }

    function verifyAnchor(
        bytes32 anchorId,
        bytes32 contentHash
    )
        external
        view
        returns (bool)
    {
        if (
            !anchorExists[anchorId]
        ) {
            return false;
        }

        return (
            anchors[anchorId]
                .contentHash
            ==
            contentHash
        );
    }

    function exists(
        bytes32 anchorId
    )
        external
        view
        returns (bool)
    {
        return anchorExists[
            anchorId
        ];
    }
}