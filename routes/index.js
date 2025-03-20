const router = require("express").Router();

const userRoute = require("./userRouter");
router.use("/users", userRoute);

const mindmapRoute = require("./mindmapRouter");
router.use("/mindmaps", mindmapRoute);

module.exports = router;