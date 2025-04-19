const router = require('express').Router();

const authRoute = require('./authRouter');
router.use('/auth', authRoute);

const userRoute = require('./userRouter');
router.use('/users', userRoute);

const mindmapRoute = require('./mindmapRouter');
router.use('/mindmaps', mindmapRoute);

const participantRoute = require('./participantRouter');
router.use('/participants', participantRoute);

const favoriteRoute = require('./favoriteRouter');
router.use('/favorites', favoriteRoute);

module.exports = router;
