# Todo Franchise

A multi-container Todo API built with Express and MongoDB, running in Docker Compose.

## What I Learned Building This

This project started as a straightforward CRUD API, but the real learning happened when I started testing it properly and found problems I had to debug one by one.

### Problem 1: The API Was Lying About Missing Resources

When I sent a PUT or DELETE request for a todo that didn't exist, the API returned `200 OK` with `null` in the body. I didn't even notice this at first -- the 200 status code made me think everything was fine, and I only caught it when I actually looked at the response body and saw `null` staring back at me. That's a lie -- the client thinks the operation succeeded when nothing actually happened. The fix was to check the return value of `findByIdAndUpdate` and `findByIdAndDelete`. If they return `null`, the document was never there, so I now return a `404` with a clear error message instead.

### Problem 2: node_modules Was Committed to Git

I realized I had committed the entire `node_modules` directory to the repository. That's thousands of files that have no business being tracked by version control. I added `node_modules/` to `.gitignore` and removed the tracked files. This also matters for the Docker build, which is why `node_modules` is in `.dockerignore` too -- the container installs its own dependencies during the build.

### Problem 3: nodemon Was Running in the Production Image

My `Dockerfile` was running `npm run dev`, which starts the app with nodemon. Nodemon is a development tool that watches for file changes and restarts the server. That makes no sense inside a production container -- there are no file changes happening in there, and nodemon adds unnecessary overhead. I split the scripts in `package.json` into `start` (using plain `node`) and `dev` (using nodemon), and made the Dockerfile use `npm start`. Nodemon is now listed under `devDependencies` where it belongs, and the Dockerfile uses `npm ci --only=production` so dev dependencies like nodemon don't end up in the image at all.

### Problem 4: When MongoDB Went Down, the API Froze

This was the most interesting one. If MongoDB crashed or was stopped, any request to the API would just hang forever -- no error, no timeout, nothing. The client would sit there waiting. My first instinct was that the API container had crashed, but `docker compose logs` showed it was still running -- it was just stuck waiting for a database that wasn't there. I fixed this in a few layers:

- Added a `/health` endpoint that checks `mongoose.connection.readyState` and returns either `200 healthy` or `503 unhealthy`.
- Added healthchecks in `docker-compose.yml` for both the API and the database containers so Docker itself knows when something is wrong.
- Added `restart: on-failure` to the API service so it comes back up automatically.
- Added a `connectWithRetry` function that tries to connect to MongoDB up to 5 times with a 3-second delay between attempts before giving up.

## Architecture

```
                    Docker Network
          +---------------------------------+
          |                                 |
Client ---+--> Express API :3000 ----> MongoDB :27017
          |    (api container)      (database container)
          |                                 |
          +---------------------------------+
                                            |
                                    mongo-data volume
```

The two containers live on the same Docker network created by Compose. The API connects to MongoDB using the service name `database` as the hostname. MongoDB data is persisted to a named volume so it survives container restarts.

## Tech Stack

- **Node.js 18** (Alpine image) with **Express** for the API
- **MongoDB** with **Mongoose** as the ODM
- **Docker** and **Docker Compose** for containerization
- **nodemon** for local development (dev dependency only)

## API Endpoints

| Method | Endpoint | Description | Success Code |
|--------|----------|-------------|--------------|
| GET | `/todos` | List all todos | 200 |
| GET | `/todos/:id` | Get a single todo by ID | 200 |
| POST | `/todos` | Create a new todo | 201 |
| PUT | `/todos/:id` | Update a todo by ID | 200 |
| DELETE | `/todos/:id` | Delete a todo by ID | 200 |
| GET | `/health` | Check API and database health | 200 / 503 |

A todo has three fields:
- `task` (string, required) -- what needs to be done
- `completed` (boolean, defaults to false)
- `createdAt` (date, auto-generated)

## How to Run

Make sure you have Docker and Docker Compose installed, then:

```bash
docker compose up --build
```

The API will be available at `http://localhost:3000`. To create a todo:

```bash
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"task": "Learn Docker Compose"}'
```

To list all todos:

```bash
curl http://localhost:3000/todos
```

To stop everything:

```bash
docker compose down
```

To stop everything and wipe the database:

```bash
docker compose down -v
```

## How to Break It and Watch It Recover

This is the fun part. Start the project and confirm the health endpoint reports healthy:

```bash
curl http://localhost:3000/health
```

You should see:

```json
{"status":"healthy","db":"connected"}
```

Now kill the MongoDB container while the API keeps running:

```bash
docker compose stop database
```

Check the health endpoint again:

```bash
curl http://localhost:3000/health
```

This time you should get a `503` response:

```json
{"status":"unhealthy","db":"disconnected","readyState":0}
```

The API is still up and can tell you honestly that the database is gone. Now bring MongoDB back:

```bash
docker compose start database
```

Wait a few seconds for MongoDB to finish starting, then check health again. (The first time I did this, I checked health again immediately and got `unhealthy` -- I had to wait a few seconds for MongoDB to finish booting.)

```bash
curl http://localhost:3000/health
```

It flips back:

```json
{"status":"healthy","db":"connected"}
```

Mongoose reconnects automatically once MongoDB is reachable again. The API never crashed -- it just reported the problem and recovered on its own.
