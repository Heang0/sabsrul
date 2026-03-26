import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Category from '@/models/Category';

// GET /api/categories - Get all categories
export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find().sort({ name: 1 });

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create category (Admin)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // TODO: Add admin authentication check

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
        { status: 400 }
      );
    }

    // Create slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const category = await Category.create({
      name,
      slug,
      description: description || '',
    });

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Category already exists' },
        { status: 400 }
      );
    }

    console.error('Create category error:', error);
    return NextResponse.json(
      { success: false, message: 'Error creating category' },
      { status: 500 }
    );
  }
}
