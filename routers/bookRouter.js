const express = require("express")

const router = express.Router();

const upload = require("../middlewares/multer")
const sessionGuard = require("../middlewares/sessionGuard")

const bookController = require("../controllers/bookController");

// # ROTTE PER I LIBRI

//inedx

router.get("/", bookController.index);

//show

router.get("/:id", bookController.show);


router.post("/", upload.single('image'), bookController.store);


router.post("/:id/reviews", sessionGuard, bookController.storeReview);

module.exports = router;