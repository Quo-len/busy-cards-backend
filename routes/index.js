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

const invitationRoute = require('./invitationRouter');
router.use('/invitations', invitationRoute);

// const notFound = require('./notFound');
// router.use(notFound);

module.exports = router;
