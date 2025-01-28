const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');
const productRoutes = require('./routes/products');
const salesRouter = require('./routes/sales');
const reportRoutes = require('./routes/report');
const { getYesterdayDate } = require('./utils/dateHelper.js');
const { generateReport } = require('./utils/generateReport.js');
const { sendReportEmail } = require('./utils/emailService.js');


require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRouter);
app.use('/api/report', reportRoutes);



// Schedule the cron job to run every day at 11:59 PM (23:59)

cron.schedule('59 23 * * *', async () => {
    console.log('Fetching and sending daily report...');

    try {
        // Generate the report for yesterday's data
        const report = await generateReport({
            startDate: getYesterdayDate(),
            endDate: getYesterdayDate(),
            reportType: 'daily'
        });

        // Ensure data exists and access the first item in the data array
        if (report.data && report.data.length > 0) {
            const reportData = report.data[0]; // Get the first report object

            // Access the fields from the reportData object
            const TotalSales = parseFloat(reportData.TotalSales);
            const TotalProfit = parseFloat(reportData.TotalProfit);
            const PreetiStock = parseInt(reportData.PreetiStock, 10); // Convert to integer
            const MaltaStock = parseInt(reportData.MaltaStock, 10); // Convert to integer
            const TotalSold = parseInt(reportData.TotalSold, 10); // Convert to integer
            

           

            // Format the report data
            const formattedReportData = `
                Total Sales: ${TotalSales}
                Total Profit: ${TotalProfit}
                Preeti Stock: ${PreetiStock}
                Malta Stock: ${MaltaStock}
                Total Sold: ${TotalSold}
            `;

            // Send the report via email
            await sendReportEmail(formattedReportData);
        } else {
            console.log("No data found for the report.");
        }
    } catch (error) {
        console.error('Error generating or sending report:', error);
    }
});




// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
