const express = require("express");
const {
  getBlock,
  listAvailableBlocks,
  listBlocks,
} = require("../controllers/blockWindowController");

const router = express.Router();

router.get("/", listBlocks);
router.get("/available", listAvailableBlocks);
router.get("/:id", getBlock);

module.exports = router;