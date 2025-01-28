const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Utility to validate dates
function isValidDate(date) {
    return !isNaN(Date.parse(date));
}

// Report Route
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, reportType } = req.query;

        // Validate inputs
        if (!['daily', 'monthly', 'yearly', 'range'].includes(reportType)) {
            return res.status(400).json({ message: 'Invalid report type' });
        }
        if (!isValidDate(startDate) || (reportType === 'range' && !isValidDate(endDate))) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        let query = `
            SELECT 
                SUM(S.TotalAmount) AS TotalSales,
                SUM(S.TotalAmount - (S.TotalAmount * S.Discount / 100)) AS TotalProfit,
                SUM(IFNULL(P.QuantityInStock, 0)) AS PreetiStock,
                SUM(IFNULL(M.QuantityInStock, 0)) AS MaltaStock,
                SUM(S.QuantitySold) AS TotalSold
            FROM Sales S
            LEFT JOIN PreetiProducts P ON S.ProductID = P.ProductID AND S.DealerName = 'Preeti'
            LEFT JOIN MaltaProducts M ON S.ProductID = M.ProductID AND S.DealerName = 'Malta'
            WHERE 1=1`;

        const params = [];

        // Add conditions based on report type
        if (reportType === 'daily') {
            query += ` AND DATE(S.SaleDate) = ?`;
            params.push(startDate);
        } else if (reportType === 'monthly') {
            const [year, month] = startDate.split('-');
            query += ` AND MONTH(S.SaleDate) = ? AND YEAR(S.SaleDate) = ?`;
            params.push(month, year);
        } else if (reportType === 'yearly') {
            query += ` AND YEAR(S.SaleDate) = ?`;
            params.push(startDate);
        } else if (reportType === 'range') {
            query += ` AND S.SaleDate BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        // Execute the query
        const [report] = await db.promise().query(query, params);
      

        res.status(200).json({ report });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating report', error });
    }
});



module.exports = router;
