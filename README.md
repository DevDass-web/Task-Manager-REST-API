# Task Manager REST API

A beginner-friendly REST API built with **Node.js, Express.js, and MySQL**. It supports creating, viewing, updating, deleting, filtering, and searching tasks.

## Features
- CRUD operations for tasks
- Filter by status and priority
- Search tasks by title or description
- Pagination with `page` and `limit`
- Input validation and consistent error responses
- MySQL connection pooling and parameterized queries
- Environment-based configuration

## Requirements
- Node.js 18+
- MySQL 8+
- npm

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/DevDass-web/Task-Manager-REST-API.git
   cd Task-Manager-REST-API
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a MySQL database and tables by running `database/schema.sql` in MySQL Workbench or phpMyAdmin.
4. Copy `.env.example` to `.env` and enter your local database settings.
5. Start the server:
   ```bash
   npm run dev
   ```
   Production-style start: `npm start`

The API runs at `http://localhost:5000` by default.

## Environment variables

| Variable | Description | Default |
|---|---|---|
| PORT | Server port | 5000 |
| DB_HOST | MySQL host | localhost |
| DB_PORT | MySQL port | 3306 |
| DB_USER | MySQL username | root |
| DB_PASSWORD | MySQL password | empty |
| DB_NAME | Database name | task_manager |

## API endpoints

Base URL: `/api`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/tasks` | List tasks |
| GET | `/tasks/:id` | Get one task |
| POST | `/tasks` | Create a task |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |

### Create a task

`POST /api/tasks`

```json
{
  "title": "Learn Express.js",
  "description": "Build my first REST API",
  "status": "pending",
  "priority": "high",
  "due_date": "2026-12-01"
}
```

Allowed status values: `pending`, `in_progress`, `completed`.

Allowed priority values: `low`, `medium`, `high`.

### Filter and search

Examples:
- `GET /api/tasks?status=pending`
- `GET /api/tasks?priority=high`
- `GET /api/tasks?search=express`
- `GET /api/tasks?page=1&limit=10`

### Example response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Learn Express.js",
      "description": "Build my first REST API",
      "status": "pending",
      "priority": "high",
      "due_date": "2026-12-01",
      "created_at": "2026-11-06T10:00:00.000Z",
      "updated_at": "2026-11-06T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

## Suggested next improvements
- Add user registration and authentication
- Add per-user task ownership
- Write automated tests with Jest or Vitest
- Add API documentation with Swagger

## Security
Never commit your real `.env` file or database credentials. The included `.gitignore` excludes it.

## License
MIT
