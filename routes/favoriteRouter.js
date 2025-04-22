const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { verifyToken, authorize } = require('../middlewares/middleware');

router
	.route('/')
	.get(favoriteController.getAllFavorites)
	.post(favoriteController.addFavorite)
	.delete(favoriteController.deleteFavorite);

router.route('/:userId/:mindmapId').get(favoriteController.getFavorite);

module.exports = router;
