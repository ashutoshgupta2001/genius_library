# Genius Library API

A backend API for managing a library's book inventory with user authentication, wishlist functionality, and asynchronous notifications.

## Features

- **Book Management** - Full CRUD operations with soft delete support
- **User Authentication** - JWT-based auth with role-based access control
- **Wishlist System** - Users can wishlist books they want
- **Async Notifications** - Background worker notifies users when wishlisted books become available
- **Audit Trail** - Track who creates, updates, and deletes books
- **Search & Filters** - Search books by title/author with pagination

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | Web framework |
| PostgreSQL | Database |
| Sequelize | ORM |
| Redis | Queue backend |
| Bull | Job queue |
| JWT | Authentication |
| Winston | Logging |

## Prerequisites

- Node.js >= 18
- PostgreSQL
- Redis

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd genius_library

# Install dependencies
npm install
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=development

# PostgreSQL
POSTGRES_GENIUS_LIBRARY_READ_WRITE=postgresql://user:password@localhost:5432/genius_library

# JWT
GENIUS_LIBRARY_JWT_SECRET=your-super-secret-key
GENIUS_LIBRARY_JWT_EXPIRES_IN=2h

# Redis
GENIUS_LIBRARY_REDIS_HOST=localhost
GENIUS_LIBRARY_REDIS_PORT=6379
```

## Running the Application

```bash
# Start the API server
npm run dev

# Start the notification worker (in a separate terminal)
npm run worker
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Register new user | ❌ |
| POST | `/api/v1/auth/login` | Login user | ❌ |

#### Register
```json
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```json
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Books

| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| GET | `/api/v1/books` | List all books (paginated) | ✅ | ❌ |
| GET | `/api/v1/books/:id` | Get single book | ✅ | ❌ |
| POST | `/api/v1/books` | Create book | ✅ | ✅ |
| PUT | `/api/v1/books/:id` | Update book | ✅ | ✅ |
| DELETE | `/api/v1/books/:id` | Delete book (soft) | ✅ | ✅ |

#### List Books with Filters
```
GET /api/v1/books?page=1&limit=10&author=Martin&publishedYear=2008&availabilityStatus=Available&q=clean
```

Query Parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `author` - Filter by author (partial match)
- `publishedYear` - Filter by year
- `availabilityStatus` - Filter by status (Available, Borrowed, Reserved)
- `q` - Search by title or author (partial match)

#### Create Book
```json
POST /api/v1/books
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "isbn": "978-0132350884",
  "publishedYear": 2008
}
```

#### Update Book (Triggers notification if Borrowed → Available)
```json
PUT /api/v1/books/:id
{
  "availabilityStatus": "Available"
}
```

### Wishlist

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/wishlist` | Add book to wishlist | ✅ |
| DELETE | `/api/v1/wishlist/:id` | Remove from wishlist | ✅ |

#### Add to Wishlist
```json
POST /api/v1/wishlist
{
  "bookId": 1
}
```

## Authentication

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Database Schema

### Users
| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| email | STRING | Unique email |
| name | STRING | User name |
| passwordHash | STRING | Hashed password |
| role | STRING | user/admin |
| isActive | BOOLEAN | Account status |

### Books
| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| title | STRING | Book title |
| author | STRING | Author name |
| isbn | STRING | Unique ISBN |
| publishedYear | INTEGER | Publication year |
| availabilityStatus | ENUM | Available/Borrowed/Reserved |
| createdBy | BIGINT | User who created |
| updatedBy | BIGINT | User who last updated |
| deletedBy | BIGINT | User who deleted |
| deletedAt | TIMESTAMP | Soft delete timestamp |

### Wishlists
| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| userId | BIGINT | FK to users |
| bookId | BIGINT | FK to books |

### NotificationLogs
| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| userId | BIGINT | FK to users |
| bookId | BIGINT | FK to books |
| message | TEXT | Notification message |

## Async Notification Flow

```
1. Admin updates book status: Borrowed → Available
2. API enqueues job to Bull queue (returns immediately)
3. Worker picks up job
4. Worker finds all users who wishlisted the book
5. Worker logs notification for each user
6. Notification stored in NotificationLogs table
```

## Project Structure

```
genius_library/
├── app/
│   ├── common/
│   │   └── logger.js         # Winston logger
│   ├── config/
│   │   └── config.js         # Convict configuration
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── bookController.js
│   │   └── wishlistController.js
│   ├── lib/
│   │   └── queue.js          # Bull queue instance
│   ├── middleware/
│   │   └── auth.js           # JWT authentication
│   ├── models/
│   │   ├── index.js          # Sequelize setup & associations
│   │   ├── book.js
│   │   ├── user.js
│   │   ├── wishlist.js
│   │   └── notificationLog.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── authRoutes.js
│   │   ├── bookRoutes.js
│   │   └── wishlistRoutes.js
│   ├── worker/
│   │   └── notificationWorker.js
│   └── server.js
├── package.json
└── README.md
```

## License

MIT

