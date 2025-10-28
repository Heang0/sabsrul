const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/auth'); // Admin authentication middleware

// --- Public/Admin Read Route ---

// @route   GET /api/categories
// @desc    Get all categories (used by frontend and admin panel)
// @access  Public
router.get('/', categoryController.getCategories);


// --- Admin Modification Routes (Protected by auth middleware) ---

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private (Admin)
router.post('/', auth, categoryController.createCategory);

// @route   PUT /api/categories/:id
// @desc    Update a category by ID
// @access  Private (Admin)
router.put('/:id', auth, categoryController.updateCategory);

// @route   DELETE /api/categories/:id
// @desc    Delete a category by ID
// @access  Private (Admin)
router.delete('/:id', auth, categoryController.deleteCategory);

module.exports = router;
