const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');

const secretKey = 'Seaeye03';

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'portfolio'
};

// Table configuration
const tableConfig = {
    name: 'work_learning'  // You can change this to any table name
};

// Create MySQL connection
const db = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convert pool to use promises
const promisePool = db.promise();

const port = process.env.PORT || 3000;
app.listen(port, () =>
{
    console.log(`Server listening on port ${ port }`);
});

// Define a route to handle incoming requests
app.get('/', (req, res) =>
{
    res.send('Hello, Express!');
});

// Middleware to parse JSON requests
app.use(express.json());

// Create (POST) a new item
app.post('/items', async (req, res) =>
{
    try
    {
        const { name } = req.body;
        const [result] = await promisePool.execute(
            `INSERT INTO ${ tableConfig.name } (name) VALUES (?)`,
            [name]
        );

        res.status(201).json({
            id: result.insertId,
            name
        });
    }
    catch (error)
    {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Read (GET) all items
app.get('/items', async (req, res) =>
{
    try
    {
        const [rows] = await promisePool.query(`SELECT * FROM ${ tableConfig.name }`);
        res.json(rows);
    }
    catch (error)
    {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Read (GET) a specific item by ID
app.get('/items/:id', async (req, res) =>
{
    try
    {
        const [rows] = await promisePool.execute(
            `SELECT * FROM ${ tableConfig.name } WHERE id = ?`,
            [req.params.id]
        );

        if (rows.length === 0)
        {
            res.status(404).json({ error: 'Item not found' });
        }
        else
        {
            res.json(rows[0]);
        }
    }
    catch (error)
    {
        console.error('Error fetching item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update (PUT) an item by ID
app.put('/items/:id', async (req, res) =>
{
    try
    {
        const { name } = req.body;
        const [result] = await promisePool.execute(
            `UPDATE ${ tableConfig.name } SET name = ? WHERE id = ?`,
            [name, req.params.id]
        );

        if (result.affectedRows === 0)
        {
            res.status(404).json({ error: 'Item not found' });
        }
        else
        {
            const [updated] = await promisePool.execute(
                `SELECT * FROM ${ tableConfig.name } WHERE id = ?`,
                [req.params.id]
            );
            res.json(updated[0]);
        }
    } catch (error)
    {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete (DELETE) an item by ID
app.delete('/items/:id', async (req, res) =>
{
    try
    {
        const [result] = await promisePool.execute(
            `DELETE FROM ${ tableConfig.name } WHERE id = ?`,
            [req.params.id]
        );

        if (result.affectedRows === 0)
        {
            res.status(404).json({ error: 'Item not found' });
        } else
        {
            res.json({ message: 'Item deleted successfully' });
        }
    } catch (error)
    {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});