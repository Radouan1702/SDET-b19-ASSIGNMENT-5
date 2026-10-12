# Blog API

This project is a Blog Management REST API with Admin, User, and Guest access levels. It provides authentication, user profile management, administrative user controls, and blog management. Authenticated users can manage their own blog posts, while administrators can manage users and any blog post. Guests can register, log in, and browse or search public blogs.

## Features

- User registration and login with JWT authentication
- Role-based authorization for Admin and User access levels
- User management by administrators, including user lookup and activation status changes
- Profile updates and password updates
- Blog CRUD operations with owner and administrator permissions
- Public blog search by partial title and filtering by category
- Request validation for authentication, user, and blog data
- Consistent `{"message": "..."}` error responses

## Tech stack

- Node.js
- Express
- MySQL
- Sequelize with `mysql2`
- `bcrypt`
- `jsonwebtoken`
- `dotenv`
- `express-validator`
- Nodemon (development tool)

## Project structure

```text
blog-api/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── blogController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── authenticate.js
│   │   ├── authorizeAdmin.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── Blog.js
│   │   ├── User.js
│   │   └── index.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── blogRoutes.js
│   │   └── userRoutes.js
│   ├── utils/
│   │   └── jwt.js
│   ├── app.js
│   └── server.js
├── blog-api.postman_collection.json
├── blog-api.postman_environment.json
├── schema.sql
├── .env.example
├── package.json
└── package-lock.json
```

## Prerequisites

- Node.js 18 or newer
- MySQL
- Postman

## Setup and installation

1. Clone the repository and install dependencies:

   ```bash
   git clone <repository-url>
   cd blog-api
   npm install
   ```

2. Create the database and tables. The `schema.sql` script creates `blogdb` if it does not already exist and creates the `users` and `blogs` tables.

   Using the MySQL CLI:

   ```sql
   CREATE DATABASE blogdb;
   ```

   Then run the schema file:

   ```bash
   mysql -u <mysql-user> -p blogdb < schema.sql
   ```

   Alternatively, open `schema.sql` in MySQL Workbench, connect to your MySQL server, and click the execute button. The script includes `CREATE DATABASE IF NOT EXISTS blogdb;` and selects the `blogdb` database before creating the tables.

3. Copy `.env.example` to `.env`.

   Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   macOS/Linux:

   ```bash
   cp .env.example .env
   ```

   Set each variable using your local values:

   | Variable | Description |
   |---|---|
   | `DB_HOST` | MySQL server hostname, such as `localhost` |
   | `DB_PORT` | MySQL server port, usually `3306` |
   | `DB_USER` | MySQL username |
   | `DB_PASSWORD` | MySQL password |
   | `DB_NAME` | Database name, normally `blogdb` |
   | `JWT_SECRET` | Long, random secret used to sign JWTs |
   | `PORT` | HTTP port for the API, normally `5000` |

   Use placeholders or your own local values in `.env`; never commit real secrets. To generate a strong JWT secret, run:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. Seed the admin user. First register a normal user through `POST /api/auth/register` using the email `admin@example.com`. Registration always creates a `user` role and can never create an administrator, so promote that account manually in MySQL:

   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
   ```

5. Run the application:

   ```bash
   npm run dev
   ```

   This starts the app with Nodemon. For a normal Node.js process, run:

   ```bash
   npm start
   ```

   Expected console output after a successful database connection:

   ```text
   Database connection established successfully.
   Server is running on port 5000.
   ```

   The base URL is `http://localhost:5000`.

## Authentication and roles

Log in with `POST /api/auth/login`. The response contains a JWT in the `token` property. Send that token on protected requests in the HTTP header:

```http
Authorization: Bearer <token>
```

The token payload contains the user `id` and `role`, and expires after 1 day. The `authenticate` middleware verifies the token and reloads the user from the database for every protected request. Therefore, a deactivated user is blocked even when using an old, otherwise valid token.

### Permission matrix

| Capability | Guest | User | Admin |
|---|---:|---:|---:|
| Register | Yes | Yes | Yes |
| Login | Yes | Yes | Yes |
| View blogs | Yes | Yes | Yes |
| Search blogs by title and filter by category | Yes | Yes | Yes |
| Create a blog | No | Yes | Yes |
| Update own blog | No | Yes | Yes |
| Delete own blog | No | Yes | Yes |
| Update another user's blog | No | No | Yes |
| Delete another user's blog | No | No | Yes |
| View own profile | No | Yes | Yes |
| Update own profile | No | Yes | Yes |
| Update own password | No | Yes | Yes |
| List users | No | No | Yes |
| Get a user by ID | No | No | Yes |
| Activate or deactivate users | No | No | Yes |

## API endpoints

The API uses the base URL `http://localhost:5000`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | Guest | Register a new user |
| `POST` | `/api/auth/login` | Guest | Log in and receive a JWT |
| `GET` | `/api/blogs` | Guest | View blogs; optionally search by partial `title` and filter by exact `category` |
| `GET` | `/api/blogs/:id` | Guest | Get one blog by ID |
| `POST` | `/api/blogs/create` | User/Admin | Create a blog owned by the authenticated user |
| `PUT` | `/api/blogs/update/:id` | Owner/Admin | Update a blog |
| `DELETE` | `/api/blogs/delete/:id` | Owner/Admin | Delete a blog |
| `GET` | `/api/users` | Admin | List users |
| `GET` | `/api/users/profile` | User/Admin | Get the authenticated user's profile |
| `PUT` | `/api/users/profile/update` | User/Admin | Update the authenticated user's name |
| `PATCH` | `/api/users/password` | User/Admin | Update the authenticated user's password |
| `GET` | `/api/users/:id` | Admin | Get a user by ID |
| `PATCH` | `/api/users/:id/status` | Admin | Activate or deactivate a user |

`DELETE /api/blogs/:id` also works as an alias of `DELETE /api/blogs/delete/:id`.

The health endpoint is available without authentication:

```http
GET /health
```

### Request and response examples

Register:

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "firstname": "Jane",
  "lastname": "Doe",
  "email": "jane@example.com",
  "password": "<password>"
}
```

```json
{
  "id": 1,
  "firstname": "Jane",
  "lastname": "Doe",
  "email": "jane@example.com",
  "role": "user",
  "isActive": true,
  "createAt": "<timestamp>"
}
```

Login:

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "jane@example.com",
  "password": "<password>"
}
```

```json
{
  "message": "Login successful",
  "token": "<jwt-token>",
  "user": {
    "id": 1,
    "firstname": "Jane",
    "lastname": "Doe",
    "email": "jane@example.com",
    "role": "user"
  }
}
```

Create a blog:

```http
POST /api/blogs/create
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "blogTitle": "Getting started with APIs",
  "blog": "This is the blog content.",
  "category": "Technology"
}
```

```json
{
  "id": 1,
  "blogTitle": "Getting started with APIs",
  "blog": "This is the blog content.",
  "category": "Technology",
  "createAt": "<timestamp>",
  "updateAt": "<timestamp>",
  "author": {
    "id": 1,
    "firstname": "Jane",
    "lastname": "Doe"
  }
}
```

Search by partial title and filter by category:

```http
GET /api/blogs?title=api&category=Technology
```

```json
[
  {
    "id": 1,
    "blogTitle": "Getting started with APIs",
    "blog": "This is the blog content.",
    "category": "Technology",
    "createAt": "<timestamp>",
    "updateAt": "<timestamp>",
    "author": {
      "id": 1,
      "firstname": "Jane",
      "lastname": "Doe"
    }
  }
]
```

## Validation, error format and status codes

API errors use this JSON format:

```json
{
  "message": "Descriptive error message."
}
```

| Status | Meaning |
|---:|---|
| `200` | Request succeeded |
| `201` | Resource was created |
| `400` | Invalid input, request body, or resource ID |
| `401` | Authentication is missing, invalid, or expired |
| `403` | Authenticated user is not allowed to perform the operation, or the account is deactivated |
| `404` | Route or requested user/blog was not found |
| `409` | Registration conflicts with an existing email |
| `500` | Unexpected internal server error |

## Security notes

- Passwords are hashed with `bcrypt` before they are stored.
- Password fields are excluded from user responses and are never returned by the API.
- JWT authentication protects private endpoints.
- Role checks restrict administrator-only operations.
- `.env` and `node_modules/` are listed in `.gitignore`.
- Keep `.env` local and never commit real passwords, secrets, or tokens.

## Postman collection and documentation

Import `blog-api.postman_collection.json` and `blog-api.postman_environment.json` into Postman. Select the environment named **Blog API Environment**, then set the Current value of `adminEmail` and `adminPassword` to the credentials of the seeded administrator. Use placeholders or local values only; do not store real secrets in documentation.

The collection is re-runnable because it uses environment variables for the base URL, users, credentials, tokens, and resource IDs. To run it, make sure the server is running and the admin user has been seeded, select the collection in Postman, open the Collection Runner, choose **Blog API Environment**, and start the run.

Postman API Documentation: [https://documenter.getpostman.com/view/58717857/2sBYHRU1tp]

Postman Collection: [Postman Collection: blog-api.postman_collection.json]

## Author

Radouan Ahmed
Batch 19 - API Development Assignment
