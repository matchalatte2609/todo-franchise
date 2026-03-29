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
    try {
        const todos = await Todo.find();
        res.json(todos);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});
app.get('/todos/:id', async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) {
            return res.status(404).json({ error: "Todo not found" });
        }
        res.json(todo);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});
app.put('/todos/:id', async (req, res) => {
    try {
        const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true});
        
        if (!updatedTodo) {
            return res.status(404).json({ error: "Todo not found"});
        }

        res.json(updatedTodo);
    } catch (err) {
        res.status(400).send();
    }
    
});
app.delete('/todos/:id', async(req, res) => {
    try {
        const deletedToDo = await Todo.findByIdAndDelete(req.params.id);
        
        if (!deletedToDo) {
            return res.status(404).json({ error: "Todo not found"});
        }

        res.json({ message: "Todo deleted successfully" });
    } catch (err) {
        res.status(400).send();
    }
    
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => app.listen(3000, () => console.log('Server & DB Ready')))
    .catch(err => console.log(err));
