const Mindmap = require('../models/mindmap');

module.exports = {
    getAllMindmaps: async (req, res) => {
        try {
            const mindmaps = await Mindmap.find();
            res.status(200).json(mindmaps);
        } catch (error) {
            res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    },
    getMindmap: async (req, res) => {
        try {
            const mindmap = await Mindmap.findById(req.params.id);
            if (!mindmap) {
                res.status(404).json({ error: 'Mindmap not found by id ' + req.params.id });
            }
            res.status(200).json(mindmap);
        } catch (error) {
            res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    },
    addMindmap: async (req, res) => {
        try {
            const { title, description, owner } = req.body;
            const mindmap = new Mindmap({ title, description, owner });
            await mindmap.save();
            res.status(201).json(mindmap);
        } catch (error) {
            res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    },
    updateMindmap: async (req, res) => {
        try {
            const mindmap = await Mindmap.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!mindmap) {
                res.status(404).json({ error: 'Mindmap not found by id ' + req.params.id });
            }
            res.status(200).json(mindmap);
        } catch (error) {
            res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    },
    deleteMindmap: async (req, res) => {
        try {
            const mindmap = await Mindmap.findByIdAndDelete(req.params.id);
            if (!mindmap) {
                return res.status(404).json({ error: "Mindmap not found" });
            }
            res.status(200).json({ message: "Mindmap deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    }
    // all mindmaps that user has access to
    // all mindmaps that user owns
};