const db = require('../models');

const User = db.User;

module.exports = {
    getAllUsers: async (req, res) => {
        try {
            const users = await User.find();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    },
    getUser: async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found by id ' + req.params.id });
            }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    },
    getUserEmail: async (req, res) => {
        try {
            const user = await User.findOne({ email: req.params.email });
            if (!user) {
                return res.status(404).json({ error: 'User not found by email ' + req.params.email });
            }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    },
    addUser: async (req, res) => {
        try {
            const { email, password, username } = req.body;
            const user = new User({ email, password, username });
            await user.save();
            res.status(201).json(user);
        } catch (error) {
            res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    },
    updateUser: async (req, res) => {
        try {
            const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!user) {
                return res.status(404).json({ error: 'User not found by id ' + req.params.id });
            }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    },
    deleteUser: async (req, res) => {
        try {
            const user = await User.findByIdAndDelete(req.params.id);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            res.status(200).json({ message: "User deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    }
};