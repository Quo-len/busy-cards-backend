const notFound = (req, res) => {
	res.status(418).send('Route does not exist');
};

module.exports = notFound;
