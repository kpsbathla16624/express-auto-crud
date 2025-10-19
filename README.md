# 🚀 Express Auto CRUD

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)

A lightweight, zero-configuration library that **auto-generates full CRUD REST endpoints** for any Mongoose model — including pagination, filtering, sorting, and lifecycle hooks.

Stop writing repetitive CRUD code. One function call, five endpoints ready. 🎯

---

## ✨ Features

- 🔄 **Full CRUD endpoints** - GET, POST, PUT, DELETE automatically generated
- 📄 **Pagination** - Built-in pagination with customizable limits
- 🔍 **Filtering** - Query any field with whitelisted filters
- ↕️ **Sorting** - Ascending/descending sort on allowed fields
- 🧩 **Middleware support** - Per-operation or global middleware
- 🪝 **Lifecycle hooks** - Before/after hooks for all operations
- 👁️ **Field projection** - Include/exclude fields from responses
- 🔗 **Population** - Auto-populate referenced documents
- 🛡️ **Type-safe** - Full TypeScript support with generics
- ⚡ **Lightweight** - < 2KB runtime footprint
- 🎨 **Zero config** - Works out of the box with sensible defaults

---

## 📦 Installation

```bash
npm install express-auto-crud
```

**Requirements:**
- Node.js >= 18.0.0
- Express >= 5.0.0
- Mongoose >= 8.0.0

---

## 🚀 Quick Start

```typescript
import express from 'express';
import mongoose from 'mongoose';
import { autoCRUD } from 'express-auto-crud';

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/mydb');

const app = express();
app.use(express.json());

// Define your model
const User = mongoose.model('User', {
  name: String,
  email: String,
  age: Number,
}, { timestamps: true });

// Generate CRUD endpoints with ONE line
autoCRUD(app, User, '/users');

app.listen(3000, () => console.log('✅ API ready on port 3000'));
```

**That's it!** You now have 5 fully functional endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users` | List all users (paginated, filterable, sortable) |
| `GET` | `/users/:id` | Get single user by ID |
| `POST` | `/users` | Create new user |
| `PUT` | `/users/:id` | Update user by ID |
| `DELETE` | `/users/:id` | Delete user by ID |

---

## 📖 Usage Examples

### Basic Usage

```typescript
autoCRUD(app, User, '/users');
```

### With Options

```typescript
autoCRUD(app, User, '/users', {
  pagination: { 
    defaultLimit: 10, 
    maxLimit: 50 
  },
  sort: { 
    default: '-createdAt', 
    allowed: ['name', 'age', 'createdAt'] 
  },
  filter: { 
    allowed: ['age', 'role', 'isActive'] 
  },
  projection: { 
    __v: 0,  // Exclude version field
    password: 0  // Exclude password field
  }
});
```

### With Middleware

```typescript
import { authMiddleware, adminOnly } from './middleware.js';

autoCRUD(app, User, '/users', {
  middleware: {
    all: [authMiddleware],  // Applied to all routes
    create: [adminOnly],     // Only for POST
    update: [adminOnly],     // Only for PUT
    delete: [adminOnly],     // Only for DELETE
  }
});
```

### With Hooks

```typescript
autoCRUD(app, User, '/users', {
  hooks: {
    beforeCreate: async (req, data) => {
      // Add created by user ID
      data.createdBy = req.user.id;
      // Hash password before saving
      data.password = await bcrypt.hash(data.password, 10);
    },
    afterCreate: async (req, doc) => {
      // Send welcome email
      await sendWelcomeEmail(doc.email);
      console.log(`✅ User ${doc.name} created`);
    },
    beforeDelete: async (req, id) => {
      // Check if user can be deleted
      const user = await User.findById(id);
      if (user.role === 'admin') {
        throw new Error('Cannot delete admin users');
      }
    },
    afterDelete: async (req, id) => {
      // Cleanup related data
      await Post.deleteMany({ userId: id });
      console.log(`🗑️ User ${id} and related data deleted`);
    }
  }
});
```

### With Population

```typescript
const Post = mongoose.model('Post', {
  title: String,
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
});

autoCRUD(app, Post, '/posts', {
  populate: ['author', 'category']  // Auto-populate references
});
```

### With Custom Validation

```typescript
autoCRUD(app, User, '/users', {
  validateBody: (body) => {
    // Custom validation logic
    if (!body.email || !body.email.includes('@')) {
      return false;
    }
    if (body.age && body.age < 18) {
      return false;
    }
    return true;
  }
});
```

---

## 🔌 API Reference

### `autoCRUD(app, model, baseRoute, options?)`

#### Parameters

- **`app`** (`Express`) - Express application instance
- **`model`** (`Model`) - Mongoose model
- **`baseRoute`** (`string`) - Base route path (e.g., `/users`)
- **`options`** (`AutoCrudOptions`) - Optional configuration

#### Options

```typescript
interface AutoCrudOptions {
  middleware?: {
    list?: RequestHandler[];      // Middleware for GET /resource
    getOne?: RequestHandler[];    // Middleware for GET /resource/:id
    create?: RequestHandler[];    // Middleware for POST /resource
    update?: RequestHandler[];    // Middleware for PUT /resource/:id
    delete?: RequestHandler[];    // Middleware for DELETE /resource/:id
    all?: RequestHandler[];       // Applied to all routes
  };

  projection?: Record<string, number>;  // Mongoose projection
  populate?: string[];                   // Fields to populate

  pagination?: {
    enabled?: boolean;        // Enable/disable pagination (default: true)
    defaultLimit?: number;    // Default items per page (default: 20)
    maxLimit?: number;        // Maximum items per page (default: 100)
  };

  sort?: {
    default?: string;         // Default sort field (default: '-createdAt')
    allowed?: string[];       // Whitelisted sort fields
  };

  filter?: {
    enabled?: boolean;        // Enable/disable filtering (default: true)
    allowed?: string[];       // Whitelisted filter fields
  };

  validateBody?: (body: any) => boolean | Promise<boolean>;

  hooks?: {
    beforeCreate?: (req, data) => Promise<void> | void;
    afterCreate?: (req, doc) => Promise<void> | void;
    beforeUpdate?: (req, data) => Promise<void> | void;
    afterUpdate?: (req, doc) => Promise<void> | void;
    beforeDelete?: (req, id) => Promise<void> | void;
    afterDelete?: (req, id) => Promise<void> | void;
  };
}
```

---

## 🔍 Query Parameters

### Pagination

```bash
GET /users?page=2&limit=10
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

### Filtering

```bash
GET /users?age=25&role=admin&isActive=true
```

Filter by any field (must be in `filter.allowed` array).

### Sorting

```bash
GET /users?sort=-createdAt
```

| Syntax | Description |
|--------|-------------|
| `sort=name` | Sort by name (ascending) |
| `sort=-name` | Sort by name (descending) |
| `sort=age` | Sort by age (ascending) |
| `sort=-createdAt` | Sort by creation date (newest first) |

### Combined Query

```bash
GET /users?role=admin&age=30&sort=-createdAt&page=1&limit=5
```

---

## 📊 Response Format

### List Response (with pagination)

```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "age": 30,
      "createdAt": "2025-10-19T10:30:00.000Z",
      "updatedAt": "2025-10-19T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 124,
    "page": 1,
    "limit": 10,
    "totalPages": 13,
    "hasNextPage": true
  }
}
```

### Single Document Response

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "createdAt": "2025-10-19T10:30:00.000Z",
  "updatedAt": "2025-10-19T10:30:00.000Z"
}
```

### Delete Response

```json
{
  "success": true,
  "message": "Document deleted successfully",
  "id": "507f1f77bcf86cd799439011"
}
```

### Error Response

```json
{
  "error": true,
  "message": "Document not found"
}
```

---

## 🛡️ Error Handling

All errors return JSON with proper HTTP status codes:

| Status | Description |
|--------|-------------|
| `400` | Bad Request (validation failed, invalid body) |
| `404` | Not Found (document doesn't exist) |
| `500` | Internal Server Error (database error, etc.) |

---

## 💡 Advanced Examples

### Multiple Models

```typescript
// Users CRUD
autoCRUD(app, User, '/users', {
  filter: { allowed: ['role', 'isActive'] }
});

// Posts CRUD
autoCRUD(app, Post, '/posts', {
  populate: ['author'],
  filter: { allowed: ['status', 'category'] }
});

// Comments CRUD
autoCRUD(app, Comment, '/comments', {
  populate: ['author', 'post'],
  middleware: { create: [authMiddleware] }
});
```

### Role-Based Access Control

```typescript
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: true, message: 'Forbidden' });
  }
  next();
};

autoCRUD(app, User, '/users', {
  middleware: {
    all: [authMiddleware],
    create: [isAdmin],
    update: [isAdmin],
    delete: [isAdmin]
  }
});
```

### Soft Delete Implementation

```typescript
autoCRUD(app, User, '/users', {
  hooks: {
    beforeDelete: async (req, id) => {
      // Soft delete instead of hard delete
      await User.findByIdAndUpdate(id, { 
        isDeleted: true,
        deletedAt: new Date() 
      });
      throw new Error('SOFT_DELETE'); // Prevent actual deletion
    }
  }
});
```

### Audit Logging

```typescript
autoCRUD(app, User, '/users', {
  hooks: {
    afterCreate: async (req, doc) => {
      await AuditLog.create({
        action: 'CREATE',
        model: 'User',
        documentId: doc._id,
        userId: req.user.id,
        timestamp: new Date()
      });
    },
    afterUpdate: async (req, doc) => {
      await AuditLog.create({
        action: 'UPDATE',
        model: 'User',
        documentId: doc._id,
        userId: req.user.id,
        timestamp: new Date()
      });
    }
  }
});
```

---

## 🧪 Testing

Create a test file and use your favorite HTTP client:

```bash
# Create user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","age":30}'

# List users
curl http://localhost:3000/users

# Get user
curl http://localhost:3000/users/{id}

# Update user
curl -X PUT http://localhost:3000/users/{id} \
  -H "Content-Type: application/json" \
  -d '{"age":31}'

# Delete user
curl -X DELETE http://localhost:3000/users/{id}
```

---

## 📝 TypeScript Support

Full TypeScript support with type definitions included:

```typescript
import type { AutoCrudOptions, PaginationResult, ListResponse } from 'express-auto-crud';
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---


## 🙏 Acknowledgments

Built with ❤️ using:
- [Express](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)
- [TypeScript](https://www.typescriptlang.org/)

---

## 📬 Support

- 📧 Email: kamalpreet6198@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/express-auto-crud/issues)

---

**⭐ If you find this package helpful, please consider giving it a star on GitHub!**