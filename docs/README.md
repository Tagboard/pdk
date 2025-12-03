# Partner Development Kit - Tagboard

The Partner Development Kit (PDK) allows Tagboard partners to embed their own Experiences within graphics created within Tagboard.

These Experiences are rendered within an IFrame element, so the target Experience needs to allow Tagboard origins: [X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options).

## Authentication

Partners need to support OAuth, so Tagboard can retrieve access/refresh tokens on behalf of the user. These tokens will be used to fetch a list of Experiences, or additional details about an Experience by ID. These Experiences will include all the information we'll need, including:

- The URL of the Experience that will go into the IFrame (i.e. Browser Source) element. This URL can include variables that will be replaced when rendered. For example:

```
https://example.com/experience/{{field1}}?someQueryParam={{field2}}
```

- A list of additional fields that the Tagboard user will be able to change. These fields will also include all available options if it should be a dropdown, otherwise it will allow the user to enter text directly.
- A list of triggers that should be supported by the Experience. These triggers will appear as buttons in Tagboard Producer, and when pressed will send messages to the Experience IFrame using [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).
