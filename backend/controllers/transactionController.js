
import { getMonthName } from "../libs/util.js";
import { pool } from "../libs/database.js";

export const getTransactions = async (req, res) => {
  try {
    const today = new Date();

    const _sevenDaysAgo = new Date(today);

    _sevenDaysAgo.setDate(today.getDate() - 7);

    const sevenDaysAgo = _sevenDaysAgo.toISOString().split("T")[0];

    const { df, dt, s } = req.query;

    const { userId } = req.body.user;

    const startDate = new Date(df || sevenDaysAgo);
    const endDate = new Date(dt || new Date());

    const transactions = await pool.query({
      text: `SELECT * FROM tbltransaction WHERE user_id = $1 AND createdat BETWEEN $2 AND $3 AND (description ILIKE '%' || $4 || '%' OR status ILIKE '%' || $4 || '%' OR source ILIKE '%' || $4 || '%') ORDER BY id DESC`,
      values: [userId, startDate, endDate, s],
    });

    res.status(200).json({
      status: "success",
      data: transactions.rows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "failed", message: error.message });
  }
};

export const getDashboardInformation = async (req, res) => {
  try {
    const { userId } = req.body.user;

    let totalIncome = 0;
    let totalExpense = 0;

    const transactionsResult = await pool.query({
      text: `SELECT type, SUM(amount) AS totalAmount FROM tbltransaction WHERE user_id = $1 GROUP BY type`,
      values: [userId],
    });

    const transactions = transactionsResult.rows;

    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        totalIncome += transaction.totalamount;
      } else {
        totalExpense += transaction.totalamount;
      }
    });

    const availableBalance = totalIncome - totalExpense;

    // Aggregate transactions to sum by type and group by month
    const year = new Date().getFullYear();
    const start_Date = new Date(year, 0, 1); // January 1st of the year
    const end_Date = new Date(year, 11, 31, 23, 59, 59); // December 31st of the year

    const result = await pool.query({
      text: `
      SELECT 
        EXTRACT(MONTH FROM createdat) AS month,
        type,
        SUM(amount) AS totalAmount 
      FROM 
        tbltransaction 
      WHERE 
        user_id = $1 
        AND createdat BETWEEN $2 AND $3 
      GROUP BY 
        EXTRACT(MONTH FROM createdat), type`,
      values: [userId, start_Date, end_Date],
    });

    //   organise data

    const data = new Array(12).fill().map((_, index) => {
      const monthData = result.rows.filter(
        (item) => parseInt(item.month) === index + 1
      );

      const income =
        monthData.find((item) => item.type === "income")?.totalamount || 0;

      const expense =
        monthData.find((item) => item.type === "expense")?.totalamount || 0;

      return {
        label: getMonthName(index),
        income,
        expense,
      };
    });

    // Fetch last transactions
    const lastTransactionsResult = await pool.query({
      text: `SELECT * FROM tbltransaction WHERE user_id = $1 ORDER BY id DESC LIMIT 5`,
      values: [userId],
    });

    const lastTransactions = lastTransactionsResult.rows;

    // Fetch last accounts
    const lastAccountResult = await pool.query({
      text: `SELECT * FROM tblaccount WHERE user_id = $1 ORDER BY id DESC LIMIT 4`,
      values: [userId],
    });

    const lastAccount = lastAccountResult.rows;

    res.status(200).json({
      status: "success",
      availableBalance,
      totalIncome,
      totalExpense,
      chartData: data,
      lastTransactions,
      lastAccount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "failed", message: error.message });
  }
};
/*export const addTransaction = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { account_id } = req.params;
    const { description, source, amount, category_id, type, destination_account_id } = req.body;

    // Validate required fields
    if (!description || !source || !amount || !type) {
      return res.status(400).json({ 
        status: "failed", 
        message: "Missing required fields: description, source, amount, type" 
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        status: "failed",
        message: "Amount must be greater than 0"
      });
    }

    // Get source account info
    const accountResult = await pool.query(
      'SELECT * FROM tblaccount WHERE id = $1',
      [account_id]
    );
    const sourceAccount = accountResult.rows[0];

    if (!sourceAccount) {
      return res.status(404).json({
        status: "failed",
        message: "Source account not found"
      });
    }

    // Begin transaction
    await pool.query("BEGIN");
   
    try {
      switch (type.toLowerCase()) {
        case 'expense':
          if (sourceAccount.account_balance < amount) {
            throw new Error("Insufficient funds for expense");
          }
          await pool.query(
            `UPDATE tblaccount 
             SET account_balance = account_balance - $1 
             WHERE id = $2`,
            [amount, account_id]
          );
          break;

        case 'income':
          await pool.query(
            `UPDATE tblaccount 
             SET account_balance = account_balance + $1 
             WHERE id = $2`,
            [amount, account_id]
          );
          break;

        case 'transfer':
          if (!destination_account_id) {
            throw new Error("Destination account required for transfer");
          }

          if (sourceAccount.account_balance < amount) {
            throw new Error("Insufficient funds for transfer");
          }

          // Get destination account
          const destAccountResult = await pool.query(
            'SELECT * FROM tblaccount WHERE id = $1',
            [destination_account_id]
          );
          const destAccount = destAccountResult.rows[0];

          if (!destAccount) {
            throw new Error("Destination account not found");
          }

          // Update source account
          await pool.query(
            `UPDATE tblaccount 
             SET account_balance = account_balance - $1 
             WHERE id = $2`,
            [amount, account_id]
          );

          // Update destination account
          await pool.query(
            `UPDATE tblaccount 
             SET account_balance = account_balance + $1 
             WHERE id = $2`,
            [amount, destination_account_id]
          );

          // Create transaction records for both accounts
          await pool.query(
            `INSERT INTO tbltransaction 
             (user_id, description, type, status, amount, source, related_account_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, description, 'transfer-out', 'Completed', amount, source, destination_account_id]
          );

          await pool.query(
            `INSERT INTO tbltransaction 
             (user_id, description, type, status, amount, source, related_account_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, description, 'transfer-in', 'Completed', amount, source, account_id]
          );

          break;

        default:
          throw new Error("Invalid transaction type");
      }

      // For income/expense (non-transfer transactions)
      if (type !== 'transfer') {
        await pool.query(
          `INSERT INTO tbltransaction 
           (user_id, description, type, status, amount, source, category_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userId, description, type, 'Completed', amount, source, category_id]
        );
      }

      await pool.query("COMMIT");
      
      res.status(200).json({
        status: "success",
        message: `Transaction (${type}) completed successfully`
      });

    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }

  } catch (error) {
    console.error(error);
    res.status(400).json({
      status: "failed",
      message: error.message
    });
  }
};*/

export const addTransaction = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { account_id } = req.params;
    const { description, source, amount, category_id, type, destination_account_id ,category} = req.body;
    let {description_i} = description;
    
    // Validate required fields
    if (  !source || !amount || !type) {
      return res.status(400).json({ 
        status: "failed", 
        message: "Missing required fields:  source, amount, type" 
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        status: "failed",
        message: "Amount must be greater than 0"
      });
    }

    // Handle transfer case separately using the existing transferMoneyToAccount logic
    if (type.toLowerCase() === 'transfer') {
      if (!destination_account_id) {
        return res.status(400).json({
          status: "failed",
          message: "Destination account required for transfer"
        });
      }

      // Create mock request object for transferMoneyToAccount
      const mockReq = {
        body: {
          user: { userId },
          from_account: account_id,
          to_account: destination_account_id,
          amount: amount,
          description : description 
        }
      };

      const mockRes = {
        status: (code) => ({
          json: (data) => {
            if (code === 201) {
              return res.status(201).json(data);
            }
            return res.status(code).json(data);
          }
        })
      };

      // Call the existing transfer function
      return await transferMoneyToAccount(mockReq, mockRes);
    }

    // Rest of your existing income/expense logic
    const accountResult = await pool.query(
      'SELECT * FROM tblaccount WHERE id = $1',
      [account_id]
    );
    const sourceAccount = accountResult.rows[0];

    if (!sourceAccount) {
      return res.status(404).json({
        status: "failed",
        message: "Source account not found"
      });
    }

    await pool.query("BEGIN");
   
    try {
      // Existing income/expense handling
      if (type.toLowerCase() === 'expense') {
        if (sourceAccount.account_balance < amount) {
          throw new Error("Insufficient funds for expense");
        }
         description_i = description + 'expanse (' +  category + ')'
        await pool.query(
          `UPDATE tblaccount 
           SET account_balance = account_balance - $1 
           WHERE id = $2`,
          [amount, account_id]
        );
      } else if (type.toLowerCase() === 'income') {
         description_i = description + 'income (' + category + ')'
        await pool.query(
          `UPDATE tblaccount 
           SET account_balance = account_balance + $1 
           WHERE id = $2`,
          [amount, account_id]
        );
      }

      // Insert transaction record
      await pool.query(
        `INSERT INTO tbltransaction 
         (user_id, description, type, status, amount, source, category_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, description_i, type, 'Completed', amount, source, category_id]
      );

      await pool.query("COMMIT");
      
      res.status(200).json({
        status: "success",
        message: `Transaction (${type}) completed successfully`
      });

    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }

  } catch (error) {
    console.error(error);
    res.status(400).json({
      status: "failed",
      message: error.message
    });
  }
};

export const transferMoneyToAccount = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { from_account, to_account, amount } = req.body;

    if (!(from_account || to_account || amount)) {
      return res.status(403).json({
        status: "failed",
        message: "Provide Required Fields!",
      });
    }

    const newAmount = Number(amount);

    if (newAmount <= 0)
      return res.status(403).json({
        status: "failed",
        message: "Amount should be grater than 0.",
      });

    // Check account details and balance for the 'from_account'
    const fromAccountResult = await pool.query({
      text: `SELECT * FROM tblaccount WHERE id = $1`,
      values: [from_account],
    });

    const fromAccount = fromAccountResult.rows[0];

    if (!fromAccount) {
      return res.status(404).json({
        status: "failed",
        message: "Account information not found.",
      });
    }

    if (newAmount > fromAccount.account_balance) {
      return res.status(403).json({
        status: "failed",
        message: "Transfer failed. Insufficient account balance.",
      });
    }

    // Begin transaction
    await pool.query("BEGIN");

    // Transfer from account
    await pool.query({
      text: `UPDATE tblaccount SET account_balance = account_balance - $1,createdat  = CURRENT_TIMESTAMP WHERE id = $2`,
      values: [newAmount, from_account],
    });

    // Transfer to account
    const toAccount = await pool.query({
      text: `UPDATE tblaccount SET account_balance = account_balance + $1, createdat = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      values: [newAmount, to_account],
    });

    // Insert transaction records
    const description = `Transfer (${fromAccount.account_name} - ${toAccount.rows[0].account_name})`;

    await pool.query({
      text: `INSERT INTO tbltransaction(user_id, description, type, status, amount, source) VALUES($1, $2, $3, $4, $5, $6)`,
      values: [
        userId,
        description,
        "expense",
        "Completed",
        amount,
        fromAccount.account_name,
      ],
    });

    const description1 = `Received (${fromAccount.account_name} - ${toAccount.rows[0].account_name})`;

    await pool.query({
      text: `INSERT INTO tbltransaction(user_id, description, type, status, amount, source) VALUES($1, $2, $3, $4, $5, $6)`,
      values: [
        userId,
        description1,
        "income",
        "Completed",
        amount,
        toAccount.rows[0].account_name,
      ],
    });

    // Commit transaction
    await pool.query("COMMIT");

    res.status(201).json({
      status: "success",
      message: "Transfer completed successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "failed", message: error.message });
  }
};
