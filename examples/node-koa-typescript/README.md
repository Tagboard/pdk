# PDK Example - Node.js + Koa + TypeScript

Example web server for integrating with Tagboard via the Partner Development Kit (PDK).

## Features

- User registration and authentication
- OAuth-style token generation
- Access token expiration and refresh
- Experience management API
- Static file serving for OAuth flow and Experiences

## Getting Started

### Prerequisites

- Node.js 22.x or higher (required for TypeScript stripping support)

### Installation

```bash
npm install
```

### Running the Server

```bash
npm start
```

The server will start on `http://localhost:8080` by default.

For development with auto-reload:

```bash
npm run dev
```

## API Endpoints

### Authentication

#### Register a New User
```
POST /register
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}

Response: { "jwt": "..." }
```

#### Login
```
POST /login
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}

Response: { "jwt": "..." }
```

### OAuth (JWT Required)

#### Generate Access Token
```
POST /oauth
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret"
}

Response: {
  "accessToken": "base64-encoded-token",
  "refreshToken": "base64-encoded-token",
  "expiresIn": 3600
}
```

### Token Refresh

#### Refresh Expired Access Token
```
POST /refresh
Content-Type: application/json

{
  "refresh_token": "your-refresh-token"
}

Response: {
  "access_token": "new-access-token",
  "expires": 3600
}
```

**Note:** Access tokens expire after 1 hour (3600 seconds). Use the refresh endpoint to obtain a new access token without requiring the user to re-authenticate.

### Experience Management (JWT Required)

#### Create Experience
```
POST /experiences
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "name": "Experience Name",
  "description": "Description",
  "url": "https://example.com/experience?id={{experience_id}}",
  "qrCodeUrl": "https://example.com/qr?id={{experience_id}}",
  "type": "dashboard",
  "triggers": [...],
  "fields": [...]
}

Response: { "id": "experience-uuid" }
```

#### Get All Experiences
```
GET /experiences
Authorization: Bearer <jwt>

Response: { "experiences": [...] }
```

#### Get Experience by ID
```
GET /experiences/:id
Authorization: Bearer <jwt>

Response: { "id": "...", "name": "...", ... }
```

### PDK Endpoints (Access Token Required)

These endpoints are used by Tagboard to fetch Experience data.

#### Get All Experiences (via Access Token)
```
GET /api/experiences
Authorization: Bearer <base64-encoded-access-token>

Response: { "experiences": [...] }
```

#### Get Experience by ID (via Access Token)
```
GET /api/experiences/:id
Authorization: Bearer <base64-encoded-access-token>

Response: { "id": "...", "name": "...", ... }
```

## Token Expiration and Refresh

This example implements token expiration and refresh to demonstrate best practices:

1. **Access Token Expiration**: Access tokens expire after 1 hour (3600 seconds)
2. **Refresh Tokens**: Long-lived tokens that can be used to obtain new access tokens
3. **Automatic Validation**: The middleware automatically validates token expiration

### Token Lifecycle

1. User authenticates via OAuth and receives:
   - `accessToken`: Used for API requests (expires in 1 hour)
   - `refreshToken`: Used to get new access tokens (long-lived)
   - `expiresIn`: Time in seconds until access token expires

2. When redirecting back to Tagboard, the OAuth flow includes the `expires` parameter:
   ```
   https://tagboard.com/callback?access_token=...&refresh_token=...&expires=3600&state=...
   ```

3. When the access token expires, Tagboard will automatically call the refresh endpoint:
   ```
   POST /refresh
   { "refresh_token": "..." }
   ```

4. The refresh endpoint returns a new access token:
   ```
   { "access_token": "new-token", "expires": 3600 }
   ```

### Configuration for Tagboard

When setting up your partner integration in Tagboard, provide:

- **Base URL**: `http://localhost:8080` (or your production URL)
- **OAuth Path**: `/oauth`
- **API Path**: `/api`
- **Refresh Path**: `/refresh`
- **Default Token Expiration**: `3600` (seconds)

## Database

This example uses SQLite with an in-memory database by default. You can persist data by setting the `DB_PATH` environment variable:

```bash
DB_PATH=./data.db npm start
```

### Schema

- **users**: User accounts with hashed passwords
- **tokens**: OAuth tokens with expiration timestamps
- **experiences**: Experience configurations
- **experience_triggers**: Trigger definitions for experiences
- **experience_fields**: Configurable fields for experiences
- **experience_field_options**: Options for dropdown fields

## Static Files

- `/oauth` - OAuth authorization flow (login/register UI)
- `/experience` - Example Experience IFrame page

## Environment Variables

- `DB_PATH` - Path to SQLite database file (default: `:memory:`)
- `PASSWORD_SALT` - Salt for password hashing (default: random)
- `JWT_SECRET` - Secret for JWT signing (default: provided)
- `PORT` - Server port (default: `8080`)

## Security Notes

**This is an example application for development purposes only.** In production:

- Use proper OAuth 2.0 flows with authorization codes
- Implement HTTPS/TLS
- Use secure password hashing with per-user salts
- Validate client credentials properly
- Store secrets in secure configuration management
- Implement rate limiting
- Add comprehensive error handling
- Use a production-grade database
