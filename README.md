# Todo Franchise

A multi-container Todo API using Express, MongoDB, and Docker Compose.

## The Metaphor

Think of this project as a **restaurant franchise system**:

- **Chef** (API Container) — The Node.js/Express app. Takes customer orders (HTTP requests) and prepares them.
- **Pantry** (Database Container) — MongoDB. Stores all the orders. The `mongo-data` volume is a fireproof safe — data survives even if containers stop.
- **Secret Hallway** (Docker Network) — A private connection between Chef and Pantry. The Chef calls `database:27017` and MongoDB answers. No one outside can use this hallway.
- **Franchise Manual** (`docker-compose.yml`) — The blueprint. Anyone can run `docker compose up --build` and get an identical setup.
- **Recipe Card** (`Dockerfile`) — Instructions to train a new Chef: install Node.js, copy code, start cooking.
- **Delivery Truck Driver** (`nodemon`) — Watches for recipe changes and auto-restarts the Chef.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /todos | Get all todos |
| POST | /todos | Create a new todo |
| PUT | /todos/:id | Update a todo |
| DELETE | /todos/:id | Delete a todo |

## Usage

```bash
docker compose up --build
```

API runs at http://localhost:3000
