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
    const updateFields = {
      DOB: new Date(`${req.body.DOB}T00:00:00`),
      state: req.body.state,
      maritalStatus: req.body.maritalStatus,
      updatedAt: new Date()
    };

    const user = await User.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

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
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// Find a userId given an email
router.get('/email/:email', async (req,res) => {
  const email = req.params.email;
  try {
    const user = await User.findOne({email: email});
    if (!user) {
      res.status(500).json({ success: false, message: 'No user with the inputted email found.'});
    }
    else{
      const userId = user._id;
      res.json(userId);
    }
  }
  catch (error) {
    res.status(500).json({ success: false, message: 'Error searching for user.' });
  }
})


// Find a user id given an email.
router.post('/email/shareReport', async (req, res) => {
  const email = req.body.email;
  const permissions = req.body.permissions;
  const reportId = req.body.reportId;
  try {
    const user = await User.findOne({email: email});
    try {
      const existing_report = user.sharedReports.find((element) => element.reportId);
      if (existing_report != undefined) {
        existing_report.reportPermissions = permissions;
        user.save();
      }
      else {
        user.sharedReports.push({reportId: reportId, reportPermissions: permissions});
        user.save();
      }
    }
    catch (error) {
      res.status(500).json({success: false, message: 'Failed to save shared report to the User\'s account.'})
    }
  }
  catch (error) {
    res.status(500).json({ success: false, message: 'Failed to find user account associated with email.'});
  }
})

// Get a user's email based off their googleId
router.get('/googleId/email/:googleId', async (req, res) => {
  try {
    const { googleId } = req.params;
    
    // Find the user where the googleId matches
    const user = await User.findOne({googleId: googleId});
    
    // Return the username
    res.status(200).json(user.email);
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user email given a google ID',
      details: error.message
    });
  }
});


module.exports = router;
