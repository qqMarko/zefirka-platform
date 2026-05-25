import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ success: false });
        res.json({ 
            success: true, 
            data: user.notifications.sort((a,b) => b.date - a.date),
            pushEnabled: user.pushEnabled !== false
        });
    } catch (error) { 
        res.status(500).json({ success: false }); 
    }
});

router.post('/:userId/read', async (req, res) => {
    try {
        await User.updateOne(
            { _id: req.params.userId },
            { $set: { "notifications.$[].isRead": true } }
        );
        res.json({ success: true });
    } catch (error) { 
        res.status(500).json({ success: false }); 
    }
});

router.delete('/:userId/:notifId', async (req, res) => {
    try {
        await User.updateOne(
            { _id: req.params.userId },
            { $pull: { notifications: { _id: req.params.notifId } } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

router.delete('/:userId', async (req, res) => {
    try {
        await User.updateOne(
            { _id: req.params.userId },
            { $set: { notifications: [] } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

router.post('/settings/:userId', async (req, res) => {
    try {
        const { pushEnabled } = req.body;
        await User.findByIdAndUpdate(req.params.userId, { pushEnabled });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

export default router;