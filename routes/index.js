const router = require("express").Router();

const userRoute = require("./userRouter");
router.use("/users", userRoute);

const mindmapRoute = require("./mindmapRouter");
router.use("/mindmaps", mindmapRoute);

const participantRoute = require("./participantRouter");
router.use("/participants", participantRoute);

module.exports = router;