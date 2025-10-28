const Category = require('../models/Category');

// Get all categories
const getCategories = async (req, res) => {
    try {
        console.log('📂 Fetching categories...');
        const categories = await Category.find().sort({ name: 1 });
        console.log('✅ Categories found:', categories.length);
        res.json(categories);
    } catch (error) {
        console.error('❌ Get categories error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create category
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ message: 'Category name is required' });
        }

        // Create slug from name
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        const category = new Category({
            name,
            slug,
            description
        });

        await category.save();
        res.status(201).json(category);
    } catch (error) {
        console.error('Create category error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Category already exists' });
        }
        
        res.status(500).json({ message: 'Server error' });
    }
};

// Update category
const updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        if (name) {
            category.name = name;
            category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }

        if (description) category.description = description;

        await category.save();
        res.json(category);
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete category
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};