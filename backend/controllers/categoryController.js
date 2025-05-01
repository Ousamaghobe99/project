import { pool } from "../libs/database.js";

export const getCategories = async (req, res) => {
  const { type, userId } = req.query;

  try {
    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Invalid category type.' });
    }

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const categories = await pool.query(
      'SELECT * FROM tblcategory WHERE type = $1 AND (user_id = $2 OR is_default = true) ORDER BY name',
      [type, userId]  
    );
    res.json({ data: categories.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

export const addCategory = async (req, res) => {
  const { name, type, icon, color } = req.body;
  const { userId } = req.body.user;

  if (!name || !type || !['income', 'expense'].includes(type)) {
    return res.status(400).json({ message: 'Name and type are required, and type must be income or expense.' });
  }

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const newCategory = await pool.query(
      'INSERT INTO tblcategory (user_id, name, type, icon, color) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, name, type, icon, color]
    );
    res.status(201).json({ data: newCategory.rows[0], message: 'Category added successfully' });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Category name already exists for this type.' });
    }
    res.status(500).json({ message: 'Error adding category' });
  }
};

export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, icon, color } = req.body;

  if (!id || !name) {
    return res.status(400).json({ message: 'ID and name are required.' });
  }

  if (!req.user.id) {
    return res.status(400).json({message: "user ID is required."})
  }

  try {
    const updatedCategory = await pool.query(
      'UPDATE tblcategory SET name = $1, icon = $2, color = $3, updatedat = CURRENT_TIMESTAMP WHERE id = $4 AND user_id = $5 RETURNING *',
      [name, icon, color, id, req.user.id]
    );

    if (updatedCategory.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found or you do not have permission.' });
    }

    res.json({ data: updatedCategory.rows[0], message: 'Category updated successfully' });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Category name already exists for this type.' });
    }
    res.status(500).json({ message: 'Error updating category' });
  }
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'ID is required.' });
  }

  if (!req.user.id) {
    return res.status(400).json({message: "user ID is required."})
  }

  try {
    const deletedCategory = await pool.query(
      'DELETE FROM tblcategory WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (deletedCategory.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found or you do not have permission.' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting category' });
  }
};