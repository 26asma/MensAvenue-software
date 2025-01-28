const nodemailer = require('nodemailer');

// Create a reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use Gmail or your desired email service
    auth: {
        user: 'fathimasma26@gmail.com', // Your email address
        pass: process.env.PASSWORD   // Your email password or app-specific password
    }
});

// Function to send the report email
async function sendReportEmail(reportData) {
    const mailOptions = {
        from: 'fathimasma26@gmail.com',    // Your email address
        to: 'mensavenue@gmail.com', // Recipient's email address
        subject: 'Daily Sales Report',  // Subject of the email
        text: `Here is the daily sales report:\n\n${reportData}`  // Body content of the email
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

module.exports = { sendReportEmail };
