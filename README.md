# Knock Javascript client library

A clientside Javascript library to interact with user-facing Knock features, such as feeds.

**Note: this is a lower level library designed for building UI on top of**

## Documentation

See the [documentation](https://docs.knock.app/notification-feeds/bring-your-own-ui) for usage examples.

## Installation

```bash
yarn install @knocklabs/client
```

## Configuration

To configure the client library you will need:

1. A public API key (found in the Knock dashboard)
2. A feed channel ID (found in the Knock dashboard)
3. A user ID, and optionally an auth token for production environments

```typescript
import Knock from "@knocklabs/client";

const knockClient = new Knock(process.env.KNOCK_API_KEY);

knockClient.authenticate(
  process.env.KNOCK_USER_ID,
  process.env.KNOCK_USER_TOKEN
);
```

## Usage

You can find an example usage in a React application in the [example/App.js](https://github.com/knocklabs/client-js/blob/main/example/src/App.js) file, which is a plain-old Create React App.
