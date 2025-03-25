const express = require('express');
const router = express.Router();
const User = require('../Schemas/Users');
const Scenario = require('../Schemas/Scenario');

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      userId: user._id,
      name: user.name,
      email: user.email,
      DOB: user.DOB,
      state: user.state,
      maritalStatus: user.maritalStatus,
      createdAt: user.createdAt,     
      updatedAt: user.updatedAt      
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's scenarios
router.get('/:userId/scenarios', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find all scenarios where the userId matches
    const scenarios = await Scenario.find({ userId });
    
    // Return the scenarios
    res.status(200).json(scenarios);
  } catch (error) {
    console.error('Error fetching user scenarios:', error);
    res.status(500).json({ 
      error: 'Failed to fetch scenarios',
      details: error.message
    });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, {
      DOB: req.body.DOB,
      state: req.body.state,
      maritalStatus: req.body.maritalStatus,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

module.exports = router;
