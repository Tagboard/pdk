# Partner Development Kit - Tagboard

The Partner Development Kit (PDK) allows Tagboard partners to embed their own Experiences within graphics created within Tagboard.

These Experiences are rendered within an IFrame element, so the target Experience needs to allow Tagboard origins: [X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options).

## Authentication

Partners will need to support OAuth in order for Tagboard to retrieve necessary access/refresh tokens on behalf of the user. These tokens will be used to fetch a list of Experiences, or additional details about an Experience by ID.

To support OAuth with Tagboard, we'll need the following information about the Partner's API:

- Base URL - This is the host of the API, and where Tagboard should authenticate _and_ fetch Experiences.
- Authentication Path - The path on the host for starting the OAuth flow. e.g. `/oauth`.
    - This should grant access to Tagboard, generating necessary tokens, then redirect back to Tagboard.
    - Tagboard will attach query params: `state` and `redirectUri`, which is data about the Tagboard user & where the Partner should send users along with the following params:
        - `access_token`
        - `refresh_token` (optional)
        - `state` - Just send the same `state` back to Tagboard for tracking which account is being authenticated.
- API Path - The path on the host for fetching Experiences. e.g. `/api`.
    - Example fully resolved path: https://example.com/api/experiences.
    - Authenticated using `Authorization: Bearer <token>`.


## Experiences

Experiences are frontend applications hosted by the Partner that will then be displayed within a Graphic in Tagboard using an IFrame. Tagboard will need access (via oauth) to fetch Experiences from the Partner's API, scoped to a particular user.

These Experiences will include all the information we'll need, including:

- The URL of the Experience that will go into the IFrame (i.e. Browser Source) element. This URL can include variables that will be replaced when rendered. For example:

```
https://example.com/experience/{{field1}}?someQueryParam={{field2}}
```

- A list of additional fields that the Tagboard user will be able to change. These fields will also include all available options if it should be a dropdown, otherwise it will allow the user to enter text directly.
- A list of triggers that should be supported by the Experience. These triggers will appear as buttons in Tagboard Producer, and when pressed will send messages to the Experience IFrame using [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).

Full Experience Schema (typescript example):

```typescript
interface Experience {
  id: string
  name: string
  description: string
  url: string
  triggers: Trigger[]
  fields: Field[]
}

interface Trigger {
  id: string;
  key: string
  label: string
}

interface FieldOption {
  id: string;
  value: string
  label: string
}

interface Field {
  id: string;
  key: string
  label: string;
  defaultValue: string
  options: FieldOption[]
  isText: boolean
}
```

### API Endpoints

The base of the Partner API can be configured as necessary, but should still allow us to fetch Experiences in a CRUD-like way:

`GET /experiences` - Fetch list of Experiences, scoped by a particular user. Authenticated using `Authorization: Bearer {{access_token}}`. Expects a JSON response. Example API response:

```json
{
  "experiences": [
    {
      "id": "c76b1b51-3946-4ea4-a64a-ed60dfc2fd94",
      "name": "Basic Experience",
      "description": "Just a small test experience",
      "url": "http://localhost:8080/experience?experience_id={{experience_id}}&first_name={{first_name}}&last_name={{last_name}}&theme={{theme}}",
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
          "key": "theme",
          "label": "Theme Preference",
          "defaultValue": "dark",
          "isText": false,
          "options": [
            {
              "id": "8c3f110d-1710-438a-a921-77227db6dce7",
              "value": "dark",
              "label": "Dark"
            },
            {
              "id": "e30d64a2-e145-4954-a833-d5baa5bf00dc",
              "value": "light",
              "label": "Light"
            },
            {
              "id": "05427da1-ce26-4fd4-81cc-d89099221fea",
              "value": "salmon",
              "label": "Salmon"
            }
          ]
        }
      ]
    }
  ]
}
```
<sup>Experience URL should be publicly accessible, and _not_ a localhost URL.</sup>

`GET /experiences/:id` - Fetch a single Experience by ID. Authenticated using `Authorization: Bearer {{access_token}}`. Expects a JSON response. Example API response:

```json
{
    "id": "c76b1b51-3946-4ea4-a64a-ed60dfc2fd94",
    "name": "Basic Experience",
    "description": "Just a small test experience",
    "url": "http://localhost:8080/experience?experience_id={{experience_id}}&first_name={{first_name}}&last_name={{last_name}}&theme={{theme}}",
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
            "key": "theme",
            "label": "Theme Preference",
            "defaultValue": "dark",
            "isText": false,
            "options": [
                {
                    "id": "8c3f110d-1710-438a-a921-77227db6dce7",
                    "value": "dark",
                    "label": "Dark"
                },
                {
                    "id": "e30d64a2-e145-4954-a833-d5baa5bf00dc",
                    "value": "light",
                    "label": "Light"
                },
                {
                    "id": "05427da1-ce26-4fd4-81cc-d89099221fea",
                    "value": "salmon",
                    "label": "Salmon"
                }
            ]
        }
    ]
}
```
<sup>Experience URL should be publicly accessible, and _not_ a localhost URL.</sup>
