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
// GET /health to check mongoose healthy state
app.get('/health', (req, res) => {
    // 1 - connected, 0 - disconnected
    // 2 - connecting, 3 - disconnecting
    const isConnected = mongoose.connection.readyState === 1;
    if (isConnected) {
        return res.status(200).json({
            status: 'healthy',
            db: 'connected'
        });
    } else {
        return res.status(503).json({
            status: 'unhealthy',
            db: 'disconnected',
            readyState: mongoose.connection.readyState
        });
    }
});

// a loop that tries 5 times with a 3-second delay between attempt
const connectWithRetry = async (attempts = 5) => {
    while (attempts > 0) {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            app.listen(3000, () => console.log('Server & DB ready'));
            return;
        } catch (err) {
            attempts--;
            console.error(`Connection failed. ${attempts} tries left. Error: ${err.message}`);

            if (attempts === 0) {
                console.error('Max retries reached. Exiting...');
                process.exit(1);
            }

            await new Promise(res => setTimeout(res, 3000));
        }
    }
}

connectWithRetry();
