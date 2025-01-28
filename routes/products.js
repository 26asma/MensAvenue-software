const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get All Products (Preeti and Malta)
router.get('/', (req, res) => {
    const { dealer, size, modelNumber, color } = req.query;

    let query;
    let params = [];

    if (dealer === 'Preeti') {
        query = `SELECT * FROM PreetiProducts WHERE 1=1`;

        if (modelNumber) {
            query += ` AND ModelNumber = ?`;
            params.push(modelNumber);
        }
        if (size) {
            query += ` AND Size = ?`;
            params.push(size);
        }
        if (color) {
            query += ` AND Color = ?`;
            params.push(color);
        }
    } else if (dealer === 'Malta') {
        query = `SELECT * FROM MaltaProducts WHERE 1=1`;

        if (size) {
            query += ` AND Size = ?`;
            params.push(size);
        }
        if (color) {
            query += ` AND Color = ?`;
            params.push(color);
        }
    } else {
        return res.status(400).json({ message: 'Invalid or missing dealer name' });
    }

    db.query(query, params, (err, results) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(results);
        }
    });
});

// Add Product
router.post('/', (req, res) => {
    const { dealer, modelNumber, size, color, quantity, unitPrice } = req.body;

    let query;
    let params;

    if (dealer === 'Preeti') {
        // PreetiProducts include ModelNumber
        query = `
            INSERT INTO PreetiProducts (ModelNumber, Size, Color, QuantityInStock, UnitPrice)
            VALUES (?, ?, ?, ?, ?)
        `;
        params = [modelNumber, size, color, quantity, unitPrice];
    } else if (dealer === 'Malta') {
        // MaltaProducts does not include ModelNumber
        query = `
            INSERT INTO MaltaProducts (Size, Color, QuantityInStock, UnitPrice)
            VALUES (?, ?, ?, ?)
        `;
        params = [size, color, quantity, unitPrice];
    } else {
        return res.status(400).json({ message: 'Invalid dealer name' });
    }

    db.query(query, params, (err, results) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json({ message: 'Product added successfully!', results });
        }
    });
});



module.exports = router;
