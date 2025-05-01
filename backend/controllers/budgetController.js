import { pool } from "../libs/database.js";


// Fonction pour créer un nouveau budget
export const createBudget = async (req, res) => {
    try {
        const { category_id, budget_month, budget_amount } = req.body;
        const { userId } = req.body.user;

        // Vérifier si un budget existe déjà pour cet utilisateur, cette catégorie et ce mois
        const existingBudgetResult = await pool.query(
            'SELECT * FROM tblbudgets WHERE user_id = $1 AND category_id = $2 AND budget_month = $3',
            [userId, category_id, budget_month]
        );

        if (existingBudgetResult.rows.length > 0) {
            return res.status(409).send({ message: 'Un budget existe déjà pour cette catégorie et ce mois.' });
        }

        const newBudgetResult = await pool.query(
            'INSERT INTO tblbudgets (user_id, category_id, budget_month, budget_amount) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, category_id, budget_month, budget_amount]
        );

        res.status(201).send(newBudgetResult.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la création du budget :', error);
        res.status(500).send({ message: 'Erreur serveur lors de la création du budget.' });
    }
};

// Fonction pour récupérer tous les tblbudgets d'un utilisateur (avec possibilité de filtrage)
export const getAllBudgets = async (req, res) => {
    try {
        const {user_id}  =  req.body.user;
        const { month, year, category_id } = req.query;
        const queryParams = [user_id];
        let query = 'SELECT b.*, c.name FROM tblbudgets b JOIN tblcategory c ON b.category_id = c.id WHERE b.user_id = $1';
        let paramIndex = 2;

        if (month && year) {
            query += ` AND b.budget_month = $${paramIndex}`;
            queryParams.push(`${year}-${String(parseInt(month)).padStart(2, '0')}-01`);
            paramIndex++;
        } else if (month) {
            return res.status(400).send({ message: 'Veuillez spécifier l\'année avec le mois.' });
        } else if (year) {
            query += ` AND EXTRACT(YEAR FROM b.budget_month) = $${paramIndex}`;
            queryParams.push(year);
            paramIndex++;
        }

        if (category_id) {
            query += ` AND b.category_id = $${paramIndex}`;
            queryParams.push(category_id);
            paramIndex++;
        }

        const budgetsResult = await pool.query(query, queryParams);
        res.status(200).send(budgetsResult.rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des tblbudgets :', error);
        res.status(500).send({ message: 'Erreur serveur lors de la récupération des tblbudgets.' });
    }
};

// Fonction pour récupérer un budget spécifique par ID
export const getBudgetById = async (req, res) => {
    try {
        const budgetId = req.params.id;
        const user_id = req.user.user_id;

        const budgetResult = await pool.query(
            'SELECT b.*, c.category_name FROM tblbudgets b JOIN categories c ON b.category_id = c.category_id WHERE b.budget_id = $1 AND b.user_id = $2',
            [budgetId, user_id]
        );

        if (budgetResult.rows.length === 0) {
            return res.status(404).send({ message: 'Budget non trouvé.' });
        }

        res.status(200).send(budgetResult.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération du budget :', error);
        res.status(500).send({ message: 'Erreur serveur lors de la récupération du budget.' });
    }
};

// Fonction pour mettre à jour un budget existant
export const updateBudget = async (req, res) => {
    try {
        const budgetId = req.params.id;
        const user_id = req.user.user_id;
        const { category_id, budget_month, budget_amount } = req.body;

        // Vérifier si le budget à mettre à jour existe et appartient à l'utilisateur
        const existingBudgetResult = await pool.query(
            'SELECT * FROM tblbudgets WHERE budget_id = $1 AND user_id = $2',
            [budgetId, user_id]
        );

        if (existingBudgetResult.rows.length === 0) {
            return res.status(404).send({ message: 'Budget non trouvé.' });
        }

        // Vérifier si un autre budget existe déjà pour cet utilisateur, cette catégorie et ce mois (en excluant l'ID actuel)
        const checkExistingResult = await pool.query(
            'SELECT * FROM tblbudgets WHERE user_id = $1 AND category_id = $2 AND budget_month = $3 AND budget_id != $4',
            [user_id, category_id, budget_month, budgetId]
        );

        if (checkExistingResult.rows.length > 0) {
            return res.status(409).send({ message: 'Un budget existe déjà pour cette catégorie et ce mois.' });
        }

        const updateBudgetResult = await pool.query(
            'UPDATE tblbudgets SET category_id = $1, budget_month = $2, budget_amount = $3 WHERE budget_id = $4 AND user_id = $5 RETURNING *',
            [category_id, budget_month, budget_amount, budgetId, user_id]
        );

        if (updateBudgetResult.rows.length > 0) {
            res.status(200).send(updateBudgetResult.rows[0]);
        } else {
            res.status(404).send({ message: 'Budget non trouvé après la mise à jour (erreur interne).' });
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du budget :', error);
        res.status(500).send({ message: 'Erreur serveur lors de la mise à jour du budget.' });
    }
};

// Fonction pour supprimer un budget
export const deleteBudget = async (req, res) => {
    try {
        const budgetId = req.params.id;
        const userId = req.user.userId;

        const deleteResult = await pool.query(
            'DELETE FROM tblbudgets WHERE budget_id = $1 AND user_id = $2 RETURNING *',
            [budgetId, userId]
        );

        if (deleteResult.rows.length > 0) {
            res.status(204).send(); // Réponse 204 No Content pour une suppression réussie
        } else {
            res.status(404).send({ message: 'Budget non trouvé.' });
        }
    } catch (error) {
        console.error('Erreur lors de la suppression du budget :', error);
        res.status(500).send({ message: 'Erreur serveur lors de la suppression du budget.' });
    }
};