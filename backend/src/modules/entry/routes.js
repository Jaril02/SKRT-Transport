const express = require("express");
const {
  getAllEntries,
  getEntryByDate,
  getEntryByGrNo,
  getEntryById,
  createEntry,
  updateEntry,
  updateSingleEntry,
  bulkUploadEntries,
  deleteEntry
} = require("./controller");

const router = express.Router();

router
  .route("/")
  .get(getAllEntries)
  .post(createEntry);

router
  .route("/upload")
  .post(bulkUploadEntries);

router
  .route("/date/:date")
  .get(getEntryByDate);

router
  .route("/grno/:grNo")
  .get(getEntryByGrNo);

router
  .route("/:id/entries/:entryId")
  .put(updateSingleEntry);

router
  .route("/:id")
  .get(getEntryById)
  .put(updateEntry)
  .delete(deleteEntry);

module.exports = router;
