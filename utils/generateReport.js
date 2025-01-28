
const { getYesterdayDate } = require('./dateHelper');
const db = require('../config/db');

// Generate Report Function
async function generateReport() {
    const yesterday = getYesterdayDate();

    const query = `
        
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

    

    try {
        const [results] = await db.promise().query(query, [yesterday]);

        if (results.length === 0) {
            return { success: false, message: "No sales data found for the specified date." };
        }

        return { success: true, data: results };
    } catch (error) {
        console.error("Error generating report:", error);
        return { success: false, message: "Could not generate report.", error };
    }
}

module.exports = { generateReport };