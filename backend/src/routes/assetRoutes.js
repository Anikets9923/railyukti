const express = require("express");
const { getAsset, getAssetHistory, listAssets } = require("../controllers/assetController");
const { assetFailureRisk, assetSpares } = require("../controllers/resourceInputController");

const router = express.Router();

router.get("/", listAssets);
router.get("/:id/failure-risk", assetFailureRisk);
router.get("/:id/spares", assetSpares);
router.get("/:id/history", getAssetHistory);
router.get("/:id", getAsset);

module.exports = router;