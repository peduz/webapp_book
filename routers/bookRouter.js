const express = require("express")

const router = express.Router();

const bookController = require("../controllers/bookController");

// # ROTTE PER I LIBRI

//inedx

router.get("/", bookController.index);

//show

router.get("/:id", bookController.show);


module.exports = router;