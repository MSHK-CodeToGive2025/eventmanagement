import express from 'express';
import auth from '../middleware/auth.js';
import RegistrationForm from '../models/RegistrationForm.js';
import User from '../models/User.js';

const router = express.Router();

// Get all registration forms (admin/staff only)
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return res.status(403).json({ message: 'Not authorized to view forms' });
    }

    const forms = await RegistrationForm.find()
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get active registration forms (public)
router.get('/active', async (req, res) => {
  try {
    const forms = await RegistrationForm.find({ isActive: true })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single registration form
router.get('/:id', async (req, res) => {
  try {
    const form = await RegistrationForm.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!form) {
      return res.status(404).json({ message: 'Registration form not found' });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create registration form (admin/staff only)
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return res.status(403).json({ message: 'Not authorized to create forms' });
    }

    const { title, description, sections, isActive } = req.body;

    const form = new RegistrationForm({
      title,
      description,
      sections: sections || [],
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.userId
    });

    await form.save();

    const populatedForm = await RegistrationForm.findById(form._id)
      .populate('createdBy', 'firstName lastName');

    res.status(201).json(populatedForm);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update registration form (admin/staff only)
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return res.status(403).json({ message: 'Not authorized to update forms' });
    }

    const { title, description, sections, isActive } = req.body;

    const form = await RegistrationForm.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        sections: sections || [],
        isActive,
        updatedBy: req.user.userId
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName')
     .populate('updatedBy', 'firstName lastName');

    if (!form) {
      return res.status(404).json({ message: 'Registration form not found' });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete registration form (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete forms' });
    }

    const form = await RegistrationForm.findByIdAndDelete(req.params.id);
    if (!form) {
      return res.status(404).json({ message: 'Registration form not found' });
    }

    res.json({ message: 'Registration form deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle form active status (admin/staff only)
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return res.status(403).json({ message: 'Not authorized to toggle form status' });
    }

    const form = await RegistrationForm.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: 'Registration form not found' });
    }

    form.isActive = !form.isActive;
    form.updatedBy = req.user.userId;
    await form.save();

    const populatedForm = await RegistrationForm.findById(form._id)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    res.json(populatedForm);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 