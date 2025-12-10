# Partner Integration Guide

This guide will walk you through building a Partner API that integrates with Tagboard's Partner Development Kit (PDK). By following this guide, you'll enable Tagboard users to authenticate with your service and embed your Experiences within their Tagboard graphics.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Building OAuth Authentication](#building-oauth-authentication)
- [Building the Experiences API](#building-the-experiences-api)
- [Creating an Experience Frontend](#creating-an-experience-frontend)
- [Testing Your Integration](#testing-your-integration)
- [Production Deployment](#production-deployment)

## Overview

The Tagboard PDK enables partners to:
1. Authenticate users via OAuth
2. Provide a list of Experiences that can be embedded in Tagboard graphics
3. Render Experiences in IFrames within Tagboard Producer
4. Respond to trigger events from Tagboard

**How it works:**
1. Tagboard users connect their account to your service via OAuth
2. Tagboard fetches available Experiences from your API using the access token
3. Users configure and embed Experiences in their graphics
4. Your Experience renders in an IFrame and can respond to triggers from Tagboard Producer

## Prerequisites

Before you begin, you should have:

- A web server capable of handling HTTP requests (Node.js, Python, Ruby, etc.)
- Basic understanding of OAuth 2.0 flows
- Ability to store user credentials and access tokens
- A publicly accessible domain for production use
- Understanding of IFrames and the `postMessage` API

## Getting Started

The easiest way to understand the integration is to review and run the example application included in the PDK:

```bash
cd pdk/examples/node-koa-typescript
npm install
npm start
```

This example application demonstrates a complete Partner API implementation using Node.js and Koa.

**What you'll need to provide to Tagboard:**

1. **Base URL** - The host of your API (e.g., `https://api.partner.com`)
2. **Authentication Path** - OAuth flow entry point (e.g., `/oauth`)
3. **API Path** - Base path for Experience endpoints (e.g., `/api`)

## Building OAuth Authentication

### OAuth Flow Overview

The OAuth flow enables Tagboard to obtain access tokens on behalf of users:

```
User (Tagboard) → Partner OAuth Page → User Login/Authorization → Redirect to Tagboard with tokens
```

### Step 1: Create the OAuth Entry Point

Create an endpoint that receives OAuth requests from Tagboard. This endpoint should:

1. Accept query parameters: `state` and `redirectUri`
2. Present a login/authorization page to the user
3. Generate access and refresh tokens after successful authorization
4. Redirect back to Tagboard with the tokens

**Example endpoint:** `GET /oauth`

```typescript
// Example from node-koa-typescript
router.get('/oauth', (ctx) => {
  const { state, redirectUri } = ctx.query;
  
  // Store state and redirectUri for the callback
  // Present login/authorization UI to user
  // (see static/oauth/index.html in the example)
});
```

### Step 2: Handle User Authentication

Your OAuth page should:
- Authenticate the user (login form or existing session)
- Ask for authorization to share data with Tagboard
- Validate the request (check origin, validate client if needed)

**Key parameters:**
- `state` - JSON string containing Tagboard account information, must be returned unchanged
- `redirectUri` - Where to redirect after authorization (Tagboard callback URL)

### Step 3: Generate and Return Tokens

After successful authentication:

1. Generate an `access_token` for API authentication
2. Optionally generate a `refresh_token` for token renewal
3. Redirect to `redirectUri` with tokens and state

**Redirect URL format:**
```
{redirectUri}?access_token={token}&refresh_token={token}&state={state}
```

**Example implementation:**

```typescript
// Generate tokens (simplified - use proper OAuth in production)
router.post('/oauth', validateUser, (ctx) => {
  const { clientId, clientSecret } = ctx.request.body;
  const user = ctx.state.user;
  
  // Validate client credentials
  if (!isValidClient(clientId, clientSecret)) {
    ctx.status = 403;
    return;
  }
  
  // Create tokens
  const accessToken = generateSecureToken();
  const refreshToken = generateSecureToken();
  
  // Store tokens associated with user
  saveToken(user.id, accessToken, refreshToken, clientId);
  
  ctx.body = {
    accessToken: btoa(accessToken),
    refreshToken: btoa(refreshToken),
  };
});
```

### Step 4: Token Storage

Store tokens securely with the following information:
- `accessToken` - Primary authentication token
- `refreshToken` - Token for renewing access
- `userId` - Associated user in your system
- `clientId` - Tagboard client identifier
- `expiresAt` - Token expiration time (if applicable)

**Database schema example:**

```sql
CREATE TABLE tokens (
  accessToken TEXT PRIMARY KEY,
  refreshToken TEXT,
  clientId TEXT,
  userId TEXT,
  expiresAt TIMESTAMP,
  FOREIGN KEY(userId) REFERENCES users(id)
);
```

## Building the Experiences API

### Required Endpoints

Your API must implement these endpoints, authenticated with the Bearer token:

#### 1. List Experiences
**Endpoint:** `GET {apiPath}/experiences`

**Authentication:** `Authorization: Bearer {access_token}`

**Response:** JSON array of Experience objects

```json
{
  "experiences": [
    {
      "id": "c76b1b51-3946-4ea4-a64a-ed60dfc2fd94",
      "name": "Player Stats Dashboard",
      "description": "Real-time player statistics and performance metrics",
      "url": "https://your-domain.com/experience?id={{experience_id}}&player={{player_id}}&theme={{theme}}",
      "triggers": [
        {
          "id": "3c604c46-fb5f-4323-8e17-f66c8b65d459",
          "key": "play",
          "label": "Play"
        },
        {
          "id": "018fd6ce-43d8-46e1-b8a8-5f35444808fa",
          "key": "pause",
          "label": "Pause"
        }
      ],
      "fields": [
        {
          "id": "5187d1ca-1eab-4ba4-b5c6-602396912b65",
          "key": "player_id",
          "label": "Player",
          "defaultValue": "player-123",
          "isText": false,
          "options": [
            {
              "id": "8c3f110d-1710-438a-a921-77227db6dce7",
              "value": "player-123",
              "label": "John Doe"
            },
            {
              "id": "e30d64a2-e145-4954-a833-d5baa5bf00dc",
              "value": "player-456",
              "label": "Jane Smith"
            }
          ]
        },
        {
          "id": "a1b2c3d4-e5f6-4789-0abc-def123456789",
          "key": "theme",
          "label": "Theme",
          "defaultValue": "dark",
          "isText": false,
          "options": [
            {
              "id": "theme-dark",
              "value": "dark",
              "label": "Dark"
            },
            {
              "id": "theme-light",
              "value": "light",
              "label": "Light"
            }
          ]
        }
      ]
    }
  ]
}
```

#### 2. Get Experience by ID
**Endpoint:** `GET {apiPath}/experiences/:id`

**Authentication:** `Authorization: Bearer {access_token}`

**Response:** Single Experience object (same schema as above, without wrapper)

### Implementing Token Validation Middleware

Create middleware to validate Bearer tokens:

```typescript
export const validateToken = async (ctx, next) => {
  // Extract token from Authorization header
  const authHeader = ctx.headers['authorization'];
  const token = authHeader?.match(/Bearer (.*)/)?.[1];
  
  if (!token) {
    ctx.status = 401;
    return;
  }
  
  // Decode if base64 encoded
  const accessToken = atob(token);
  
  // Lookup user by access token
  const user = getUserByAccessToken(accessToken);
  
  if (!user) {
    ctx.status = 401;
    return;
  }
  
  // Attach user to context for downstream handlers
  ctx.state.user = user;
  await next();
};
```

### Experience Schema Reference

```typescript
interface Experience {
  id: string;              // Unique identifier
  name: string;            // Display name
  description: string;     // Brief description
  url: string;             // Template URL with {{placeholders}}
  triggers: Trigger[];     // Available triggers
  fields: Field[];         // Configurable fields
}

interface Trigger {
  id: string;              // Unique identifier
  key: string;             // Message key sent via postMessage
  label: string;           // Button label in Tagboard UI
}

interface Field {
  id: string;              // Unique identifier
  key: string;             // Placeholder key (matches {{key}} in URL)
  label: string;           // Field label in Tagboard UI
  defaultValue: string;    // Default selection/value
  isText: boolean;         // true = text input, false = dropdown
  options: FieldOption[];  // Available options (if dropdown)
}

interface FieldOption {
  id: string;              // Unique identifier
  value: string;           // Actual value used in URL
  label: string;           // Display label in dropdown
}
```

### Example Implementation

```typescript
// GET /api/experiences
router.get('/api/experiences', validateToken, (ctx) => {
  const user = ctx.state.user;
  
  // Fetch experiences for this user from database
  const experiences = getExperiences(user.id);
  
  ctx.body = { experiences };
  ctx.status = 200;
});

// GET /api/experiences/:id
router.get('/api/experiences/:id', validateToken, (ctx) => {
  const user = ctx.state.user;
  const { id } = ctx.params;
  
  // Fetch specific experience
  const experience = getExperience(user.id, id);
  
  if (!experience) {
    ctx.status = 404;
    return;
  }
  
  ctx.body = experience;
  ctx.status = 200;
});
```

## Creating an Experience Frontend

### IFrame Requirements

Your Experience must:
1. Be publicly accessible via HTTPS (production)
2. Allow embedding in IFrames from Tagboard domains
3. Handle URL parameters for configuration
4. Listen for `postMessage` events for triggers

### Setting X-Frame-Options

Allow Tagboard to embed your Experience:

```javascript
// Express example
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'ALLOW-FROM https://tagboard.com');
  // Or use Content-Security-Policy
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://tagboard.com https://*.tagboard.com");
  next();
});
```

### URL Template Variables

Your Experience URL can include template variables that will be replaced with field values:

```
https://your-domain.com/experience?id={{experience_id}}&player={{player_id}}&theme={{theme}}
```

When rendered:
```
https://your-domain.com/experience?id=abc-123&player=player-456&theme=dark
```

### Parsing URL Parameters

```javascript
// Example: Parse URL parameters
const query = new URLSearchParams(window.location.search);
const experienceId = query.get('experience_id');
const playerId = query.get('player_id');
const theme = query.get('theme');

// Apply configuration
if (theme === 'dark') {
  document.body.style.background = '#000000';
  document.body.style.color = '#ffffff';
}
```

### Handling Triggers with postMessage

Listen for trigger events from Tagboard:

```javascript
// Listen for messages from Tagboard
window.addEventListener('message', (event) => {
  // Verify origin for security
  if (!event.origin.includes('tagboard.com')) {
    return;
  }
  
  // Handle trigger
  const triggerKey = event.data;
  
  switch (triggerKey) {
    case 'play':
      startAnimation();
      break;
      
    case 'pause':
      pauseAnimation();
      break;
      
    case 'reset':
      resetExperience();
      break;
      
    default:
      console.log('Unknown trigger:', triggerKey);
  }
});
```

### Complete Experience Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Experience</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
  </style>
</head>
<body>
  <h1 id="title">Experience</h1>
  <div id="content"></div>
  
  <script>
    // Parse configuration from URL
    const params = new URLSearchParams(window.location.search);
    const config = {
      experienceId: params.get('experience_id'),
      playerId: params.get('player_id'),
      theme: params.get('theme') || 'dark'
    };
    
    // Apply theme
    if (config.theme === 'dark') {
      document.body.style.background = '#000';
      document.body.style.color = '#fff';
    } else {
      document.body.style.background = '#fff';
      document.body.style.color = '#000';
    }
    
    // Display content
    document.getElementById('title').textContent = `Experience: ${config.experienceId}`;
    document.getElementById('content').textContent = `Player: ${config.playerId}`;
    
    // Listen for triggers
    window.addEventListener('message', (event) => {
      if (!event.origin.includes('tagboard.com')) return;
      
      console.log('Received trigger:', event.data);
      
      // Handle triggers
      switch (event.data) {
        case 'play':
          console.log('Starting playback...');
          break;
        case 'pause':
          console.log('Pausing...');
          break;
      }
    });
  </script>
</body>
</html>
```

## Testing Your Integration

### Local Development Setup

1. **Start your Partner API:**
   ```bash
   npm start
   # or
   python app.py
   ```

2. **Use ngrok for local testing (optional):**
   ```bash
   ngrok http 8080
   # Use the provided HTTPS URL as your base URL
   ```

3. **Configure Tagboard:**
   - Contact Tagboard to register your partner integration
   - Provide your Base URL, Authentication Path, and API Path
   - Receive a partner identifier (e.g., "debug" for testing)

### Testing the OAuth Flow

1. Navigate to Tagboard and attempt to connect your partner account
2. Verify you're redirected to your OAuth page with correct parameters
3. Complete authentication
4. Verify redirect back to Tagboard with tokens
5. Check that tokens are stored correctly

**Debugging tips:**
- Log all OAuth parameters (state, redirectUri)
- Verify state is returned unchanged
- Check token encoding (base64 if needed)
- Validate redirect URL format

### Testing the API Endpoints

Use curl or Postman to test your endpoints:

```bash
# Get list of experiences
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://your-domain.com/api/experiences

# Get specific experience
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://your-domain.com/api/experiences/EXPERIENCE_ID
```

### Testing the Experience

1. Open your Experience URL directly in a browser
2. Verify it loads correctly with URL parameters
3. Test different field configurations
4. Simulate postMessage events:

```javascript
// In browser console
const iframe = document.querySelector('iframe');
iframe.contentWindow.postMessage('play', '*');
```

## Production Deployment

### Security Checklist

- [ ] Use HTTPS for all endpoints
- [ ] Implement proper OAuth 2.0 flows
- [ ] Validate all input parameters
- [ ] Store tokens securely (encrypted at rest)
- [ ] Implement token expiration and refresh
- [ ] Validate origin of postMessage events
- [ ] Set appropriate CORS headers
- [ ] Set X-Frame-Options or CSP headers
- [ ] Use secure client credentials
- [ ] Implement rate limiting
- [ ] Log authentication attempts

### Performance Considerations

- Cache Experience data where appropriate
- Optimize Experience page load time
- Minimize JavaScript bundle size
- Use CDN for static assets
- Implement efficient database queries

### Monitoring and Logging

Track these metrics:
- OAuth success/failure rates
- API endpoint response times
- Token usage and expiration
- Experience load times
- Error rates

### Support and Troubleshooting

Common issues:

**OAuth redirect fails:**
- Verify redirectUri is properly encoded
- Check state parameter is returned unchanged
- Ensure tokens are base64 encoded if required

**Experiences not loading:**
- Check X-Frame-Options headers
- Verify URL template has correct format
- Test Experience URL directly

**Triggers not working:**
- Verify postMessage listener is set up
- Check origin validation
- Confirm trigger keys match API response

### Getting Help

For integration support:
1. Review the example application in `pdk/examples/node-koa-typescript`
2. Check the API schema in `pdk/docs/README.md`
3. Contact Tagboard partner support

## Appendix

### Complete API Specification

**OAuth Endpoint:**
- Method: `GET`
- Path: `{authPath}`
- Query Parameters: `state`, `redirectUri`
- Response: Redirect to `redirectUri` with tokens

**List Experiences:**
- Method: `GET`
- Path: `{apiPath}/experiences`
- Headers: `Authorization: Bearer {token}`
- Response: `{ experiences: Experience[] }`

**Get Experience:**
- Method: `GET`
- Path: `{apiPath}/experiences/:id`
- Headers: `Authorization: Bearer {token}`
- Response: `Experience`

### Example Partner Configuration

```javascript
{
  partnerId: "your-partner-id",
  baseUrl: "https://api.partner.com",
  authPath: "/oauth",
  apiPath: "/api",
  name: "Your Partner Name",
  description: "Integration description"
}
```

### Resources

- [OAuth 2.0 Specification](https://oauth.net/2/)
- [MDN: postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [MDN: X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
- [Example Application](../examples/node-koa-typescript)
