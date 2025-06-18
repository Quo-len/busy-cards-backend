const User = require('./User');
const Mindmap = require('./Mindmap');
const Participant = require('./Participant');
const Favorite = require('./Favorite');
const Invitation = require('./Invitation');

const { CronJob } = require('cron');

const deleteExpiredInvitationsJob = new CronJob('0 0 0 * * *', async () => {
	try {
		const result = await Invitation.deleteMany({ expiresAt: { $lte: new Date() } });
		console.log(`Deleted ${result.deletedCount} expired invitations`);
	} catch (error) {
		console.error('Error deleting expired invitations:', error);
	}
});

deleteExpiredInvitationsJob.start();

module.exports = {
	User,
	Mindmap,
	Participant,
	Favorite,
	Invitation,
};
