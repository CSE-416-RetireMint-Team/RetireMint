const express = require('express');
const router = express.Router();
const User = require('../Schemas/Users'); 

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
