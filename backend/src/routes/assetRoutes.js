const express = require("express");
const { getAsset, listAssets } = require("../controllers/assetController");

const router = express.Router();

router.get("/", listAssets);
router.get("/:id", getAsset);

module.exports = router;