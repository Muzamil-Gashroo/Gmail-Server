const express = require("express");
const emailController = require("../controllers/emailController");

const router = express.Router();

router.get("/:userEmail", emailController.getEmails);
router.post("/:userEmail/send", emailController.sendEmail);
router.get("/:userEmail/sent", emailController.getSentEmails);

module.exports = router;