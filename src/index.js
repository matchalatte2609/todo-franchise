// require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Todo = require('./models/Todo');

const app = express();
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;

// CRUD Routes
app.post('/todos', async (req, res) => {
    try {
        const newTodo = new Todo(req.body);
        const savedTodo = await newTodo.save();
        res.status(201).json(savedTodo);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});
app.get('/todos', async (req, res) => {
    const todos = await Todo.find();
    res.json(todos);
})
app.put('/todos/:id', async (req, res) => {
    const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true});
    res.json(updatedTodo);
});
app.delete('/todos/:id', async(req, res) => {
    await Todo.findByIdAndDelete(req.params.id);
    res.json({ message: "Todo deleted successfully" });
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => app.listen(3000, () => console.log('Server & DB Ready')))
    .catch(err => console.log(err));
