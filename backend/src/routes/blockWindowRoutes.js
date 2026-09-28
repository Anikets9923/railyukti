const express = require("express");
const {
  getBlock,
  listAvailableBlocks,
  listBlocks,
} = require("../controllers/blockWindowController");
const { createBlockRequest, updateBlockRequest } = require("../controllers/blockRequestController");

const router = express.Router();

router.get("/", listBlocks);
router.post("/", createBlockRequest);
router.get("/available", listAvailableBlocks);
router.put("/:id", updateBlockRequest);
router.get("/:id", getBlock);

module.exports = router;