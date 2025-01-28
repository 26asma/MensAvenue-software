// sales.js (routes for sales)
const express = require('express');
const router = express.Router();
const db = require('../config/db');  // Assuming you have a database connection file

// 1. Get All Sales
router.get('/', (req, res) => {
    let query = `
        SELECT 
            S.SaleID, S.DealerName, S.SaleDate, 
            CASE
                WHEN S.DealerName = 'Preeti' THEN P.ModelNumber
                ELSE 'N/A'
            END AS ModelNumber,
            CASE
                WHEN S.DealerName = 'Preeti' THEN P.Size
                WHEN S.DealerName = 'Malta' THEN M.Size
                ELSE 'N/A'
            END AS Size,
            CASE
                WHEN S.DealerName = 'Preeti' THEN P.Color
                WHEN S.DealerName = 'Malta' THEN M.Color
                ELSE 'N/A'
            END AS Color,
            S.QuantitySold, S.Discount, S.TotalAmount
        FROM Sales S
        LEFT JOIN PreetiProducts P ON S.ProductID = P.ProductID AND S.DealerName = 'Preeti'
        LEFT JOIN MaltaProducts M ON S.ProductID = M.ProductID AND S.DealerName = 'Malta'
    `;
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ message: 'Error retrieving sales data', error: err });
        } else {
            res.status(200).json(results);
        }
    });
});



// 2. Get Sales by Filter (date range, customer name, and product)
router.get('/filter', (req, res) => {
    const { startDate, endDate } = req.query;

    let query = `
        SELECT 
            S.SaleID, S.DealerName, S.SaleDate, 
            CASE
                WHEN S.DealerName = 'Preeti' THEN P.ModelNumber
                ELSE 'N/A'
            END AS ModelNumber,
            CASE
                WHEN S.DealerName = 'Preeti' THEN P.Size
                WHEN S.DealerName = 'Malta' THEN M.Size
                ELSE 'N/A'
            END AS Size,
            CASE
                WHEN S.DealerName = 'Preeti' THEN P.Color
                WHEN S.DealerName = 'Malta' THEN M.Color
                ELSE 'N/A'
            END AS Color,
            S.QuantitySold, S.Discount, S.TotalAmount
        FROM Sales S
        LEFT JOIN PreetiProducts P ON S.ProductID = P.ProductID AND S.DealerName = 'Preeti'
        LEFT JOIN MaltaProducts M ON S.ProductID = M.ProductID AND S.DealerName = 'Malta'
        WHERE S.SaleDate BETWEEN ? AND ?
    `;
    
    db.query(query, [startDate, endDate], (err, results) => {
        if (err) {
            res.status(500).json({ message: 'Error retrieving filtered sales data', error: err });
        } else {
            res.status(200).json(results);
        }
    });
});
router.get('/customer', (req, res) => {
    const { customerName } = req.query;

    let query = `
        SELECT 
            S.SaleID, S.DealerName, S.SaleDate, 
            CASE
                WHEN S.DealerName = 'Preeti' THEN P.ModelNumber
                ELSE 'N/A'
            END AS ModelNumber,
            CASE
                WHEN S.DealerName = 'Preeti' THEN P.Size
                WHEN S.DealerName = 'Malta' THEN M.Size
                ELSE 'N/A'
            END AS Size,
            CASE
                WHEN S.DealerName = 'Preeti' THEN P.Color
                WHEN S.DealerName = 'Malta' THEN M.Color
                ELSE 'N/A'
            END AS Color,
            S.QuantitySold, S.Discount, S.TotalAmount
        FROM Sales S
        LEFT JOIN PreetiProducts P ON S.ProductID = P.ProductID AND S.DealerName = 'Preeti'
        LEFT JOIN MaltaProducts M ON S.ProductID = M.ProductID AND S.DealerName = 'Malta'
        WHERE S.CustomerName = ?
    `;
    
    db.query(query, [customerName], (err, results) => {
        if (err) {
            res.status(500).json({ message: 'Error retrieving sales data by customer', error: err });
        } else {
            res.status(200).json(results);
        }
    });
});


// 3. Post Sale (to add a sale)
router.post('/', async (req, res) => {
    try {
        const { DealerName, ModelNumber, Size, Color, QuantitySold, Discount, TotalAmount } = req.body;

        let productID = null;

        if (DealerName === 'Preeti') {
            // Fetch ProductID for Preeti products (Kurtas) by ModelNumber, Size, and Color
            const productQuery = 'SELECT ProductID FROM PreetiProducts WHERE ModelNumber = ? AND Size = ? AND Color = ?';
            const [product] = await db.promise().query(productQuery, [ModelNumber, Size, Color]);

            if (product.length === 0) {
                return res.status(400).json({ message: "Product not found for the given ModelNumber, Size, and Color" });
            }
            productID = product[0].ProductID;
        } else if (DealerName === 'Malta') {
            // Fetch ProductID for Malta products (Pants) by Size and Color
            const productQuery = 'SELECT ProductID FROM MaltaProducts WHERE Size = ? AND Color = ?';
            const [product] = await db.promise().query(productQuery, [Size, Color]);

            if (product.length === 0) {
                return res.status(400).json({ message: "Product not found for the given Size and Color" });
            }
            productID = product[0].ProductID;
        } else {
            return res.status(400).json({ message: "Invalid DealerName" });
        }

        // Proceed with inserting the sale if productID is found
        const saleQuery = `
            INSERT INTO Sales (ProductID, DealerName, QuantitySold, Discount, TotalAmount)
            VALUES (?, ?, ?, ?, ?)`;
        await db.promise().query(saleQuery, [productID, DealerName, QuantitySold, Discount, TotalAmount]);

        // Update the stock of the sold product
        let updateStockQuery = '';
        if (DealerName === 'Preeti') {
            updateStockQuery = `UPDATE PreetiProducts SET QuantityInStock = QuantityInStock - ? WHERE ProductID = ?`;
        } else if (DealerName === 'Malta') {
            updateStockQuery = `UPDATE MaltaProducts SET QuantityInStock = QuantityInStock - ? WHERE ProductID = ?`;
        }

        await db.promise().query(updateStockQuery, [QuantitySold, productID]);

        res.status(201).json({ message: 'Sale added and stock updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding sale and updating stock', error });
    }
});


// 4. Delete Sale (to remove a sale by SaleID)
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    const query = `DELETE FROM Sales WHERE SaleID = ?`;

    db.query(query, [id], (err, result) => {
        if (err) {
            res.status(500).json({ message: 'Error deleting sale', error: err });
        } else {
            if (result.affectedRows === 0) {
                res.status(404).json({ message: 'Sale not found' });
            } else {
                res.status(200).json({ message: 'Sale deleted successfully' });
            }
        }
    });
});
router.get('/daily-report', (req, res) => {
    const { date } = req.query; // e.g., '2025-01-27'

    let query = `
        SELECT 
            SUM(S.TotalAmount) AS TotalSales,
            SUM(S.QuantitySold * P.UnitPrice) AS Cost,
            SUM(S.TotalAmount) - SUM(S.QuantitySold * P.UnitPrice) AS ProfitLoss
        FROM Sales S
        LEFT JOIN PreetiProducts P ON S.ProductID = P.ProductID AND S.DealerName = 'Preeti'
        LEFT JOIN MaltaProducts M ON S.ProductID = M.ProductID AND S.DealerName = 'Malta'
        WHERE DATE(S.SaleDate) = ?
    `;
    
    db.query(query, [date], (err, results) => {
        if (err) {
            res.status(500).json({ message: 'Error generating daily report', error: err });
        } else {
            const report = results[0];
            res.status(200).json({
                TotalSales: report.TotalSales,
                Cost: report.Cost,
                ProfitLoss: report.ProfitLoss
            });
        }
    });
});


module.exports = router;
