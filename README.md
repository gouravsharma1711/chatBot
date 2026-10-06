# Quantum Bot

Quantum Bot is a browser-based AI assistant. Its static frontend sends chat
messages to an Express API. The backend calls a Groq-hosted language model and
exposes a custom web-search tool that the model can request for information
that may have changed recently.

## Features

- Chat UI built with HTML, vanilla JavaScript, and Tailwind CSS.
- Groq Chat Completions API integration through the official `groq-sdk`.
- Tool calling with a server-side `webSearch` function.
- Web search implemented with the Tavily Core SDK.
- Input validation, loading states, and API error responses.
- Frontend rendering for paragraphs, headings, lists, inline emphasis, and
  fenced code blocks.

There is no database or persistent chat history. Each request starts a new
conversation containing the system prompt and the current user message.

## Project structure

```text
chatBot/
├── README.md
├── frontend/
│   ├── index.html
│   └── script.js
└── backend/
    ├── .env.example
    ├── .gitignore
    ├── index.js
    ├── package.json
    └── src/
        ├── App.js
        ├── controllers/
        │   └── chatBot.controller.js
        ├── routes/
        │   └── chatBot.routes.js
        ├── tools/
        │   └── webSearchTool.js
        └── utils/
            ├── LLM.js
            └── toolCalling.js
```

## Requirements

- Node.js 20.6 or later. The development script uses Node's `--env-file`
  option.
- npm.
- A Groq API key.
- A Tavily API key for web-search requests.

## Setup

### 1. Configure the backend

Open a terminal in the `backend` directory:

```sh
cd backend
npm install
```

Copy `.env.example` to `.env` and replace the placeholder API keys with your
own:

```sh
# macOS/Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

The environment variables are:

| Variable | Purpose |
| --- | --- |
| `GROQ_API` | Secret API key used by `groq-sdk`. |
| `TAVILY_API_KEY` | Secret API key used by Tavily for web search. |
| `PORT` | Local listening port. A hosting provider may set this automatically. |
| `FRONTEND_URL` | Exact browser origin allowed by the backend's CORS configuration. |
| `NODE_ENVIRONMENT` | When set to `development`, the controller includes an error stack in error responses. |

Start the backend locally:

```sh
npm run dev
```

The development script loads `backend/.env` and restarts the server when files
change. To run the production start script locally with a `.env` file, either
set the variables in the shell first or use:

```sh
node --env-file=.env index.js
```

The production `npm start` script runs `node index.js` and does not load `.env`
itself. Most hosting providers let you set environment variables in their
dashboard; use that facility in production.

### 2. Run the frontend

Serve the `frontend` directory with any static development server, such as the
VS Code Live Server extension. Open the URL it provides. The frontend uses
Tailwind's browser CDN and does not currently need a build command.

The backend's `FRONTEND_URL` must exactly match the frontend's origin, including
the scheme and host, and any non-default port. For example:

```text
http://127.0.0.1:5500
```

`http://localhost:5500` is a different origin from `http://127.0.0.1:5500`.

### 3. Connect the deployed frontend and backend

The browser request is in `frontend/script.js`. Set its API URL to the deployed
backend's public HTTPS URL, followed by `/api/v1/chats`. The currently
configured endpoint is:

```text
https://chatbot-d82r.onrender.com/api/v1/chats
```

The browser can see this URL; API hostnames are not secrets. The backend's
Groq and Tavily keys must remain in backend environment variables and must
never be placed in frontend JavaScript or frontend environment files.

Set `FRONTEND_URL` in the backend hosting dashboard to the deployed frontend's
origin, for example:

```text
https://your-frontend.example.com
```

Use only the origin in `FRONTEND_URL`—no path such as `/index.html` and no
trailing slash. Redeploy or restart the backend after changing environment
variables. CORS controls which browser origins may read responses; it does not
authenticate users or prevent direct calls to a public API.

## API

### `POST /api/v1/chats`

Request JSON:

```json
{
  "userMessage": "What is the current weather in Bengaluru?"
}
```

Successful response:

```json
{
  "success": true,
  "message": "Data Fetched Successfully",
  "aiResponse": "The assistant's answer."
}
```

An empty message is rejected with HTTP 400. Other errors are returned with
`success: false`, a `message`, and an empty `aiResponse`. In development mode,
the controller also includes a `stack` field.

Example request:

```sh
curl -X POST https://chatbot-d82r.onrender.com/api/v1/chats \
  -H "Content-Type: application/json" \
  -d "{\"userMessage\":\"What is the current weather in Bengaluru?\"}"
```

## How a chat request flows

1. `frontend/script.js` validates the input, adds the user's message to the
   conversation view, and displays loading indicators.
2. The frontend sends JSON to `POST /api/v1/chats`.
3. `backend/src/App.js` installs JSON parsing and CORS middleware, then mounts
   the chat routes at `/api/v1`.
4. `backend/src/routes/chatBot.routes.js` maps `POST /chats` to
   `chatBotChatsController`.
5. `backend/src/controllers/chatBot.controller.js` validates the message,
   calls `LLMCalling`, and responds with JSON. Errors are returned as
   `success: false` responses.
6. `backend/src/utils/LLM.js` calls Groq. If the model requests a tool,
   `toolCalling.js` executes it and adds its result to the model's message
   history. The model is called again so it can use that result to compose the
   final reply.
7. The frontend renders the assistant reply, then clears its loading state.

## Groq integration

`backend/src/utils/LLM.js` creates a `Groq` client using `GROQ_API` and sends a
chat completion request:

```js
groq.chat.completions.create({
  model: "openai/gpt-oss-120b",
  temperature: 0,
  messages,
  tools: [webSearchTool],
  tool_choice: "auto"
});
```

The configured model ID is `openai/gpt-oss-120b`. The model ID is sent as a
request option; change it in `LLM.js` to use another model available to your
Groq account. Check Groq's current model catalogue and model-specific feature
support before changing it, since availability and tool-calling support can
vary.

The `messages` array follows chat-completion roles:

- `system` provides Quantum Bot's instructions.
- `user` contains the current prompt.
- The assistant message returned with `tool_calls` records the model's request
  to invoke a tool.
- `tool` provides that tool's result, associated with the original tool call
  ID.

The system prompt instructs the model to search for information that is
current, recent, real-time, or externally verifiable. Stable questions can be
answered without a search. The application sends the current UTC date and time
in that prompt.

## How the custom web-search tool works

The model does not directly run JavaScript or access Tavily. The backend
defines a callable tool and runs it when the model asks:

1. `backend/src/tools/webSearchTool.js` exports a tool definition named
   `webSearch`. Its JSON Schema describes one required string argument:
   `query`.
2. Groq returns a `tool_calls` entry when the model decides it needs a search.
3. `backend/src/utils/LLM.js` passes the calls to `toolCalling.js`.
4. `backend/src/utils/toolCalling.js` checks the function name against the
   explicit `webSearch` allowlist, parses its JSON arguments, and calls
   `webSearchToolCallingFunction`.
5. `webSearchToolCallingFunction` calls Tavily with advanced search, asks
   Tavily to include an advanced answer, and requests up to three results. It
   returns the result contents to the model.
6. The tool result is appended as a `tool` message with its matching
   `tool_call_id`. The Groq request loop runs again, allowing the model to
   produce a user-facing answer grounded in the search result.

### Adding another tool

To add a tool, follow the same three-part pattern:

1. **Define it** in `backend/src/tools/` with a unique function name,
   description, and JSON Schema for its arguments.
2. **Implement it** as a backend function. Validate arguments before performing
   work; never execute code or commands supplied by the model.
3. **Dispatch it** in `backend/src/utils/toolCalling.js`. Explicitly allowlist
   the function name, parse and validate its arguments, run the implementation,
   and add a `tool` message containing the original tool call ID and result.
4. **Register it** in the `tools` array passed to the Groq completion request
   in `LLM.js`.

Tool calls are model suggestions, not trusted instructions. Keep dispatch
allowlisted, validate every argument, limit external calls and result sizes,
and do not expose secrets in tool results. For more tools, make dispatch
explicit for each supported name and return a clear error for unknown names.

## Error handling and operational notes

- The controller rejects blank messages with HTTP 400.
- Errors thrown by Groq or Tavily propagate through the awaited service calls
  to the controller's `catch` block.
- `LLM.js` wraps service errors and preserves an available status code; absent
  one, it uses 502.
- `LLM.js` permits up to five model requests to handle tool-call cycles before
  returning its retry-limit error.
- The frontend displays API failures in the chat and restores its loading UI.
- CORS is configured with one `FRONTEND_URL` origin. To support multiple
  origins, update the backend configuration to validate each against an
  explicit allowlist.
- The API is public unless authentication or another access-control layer is
  added. CORS alone is not authentication, and public AI endpoints should
  consider rate limits and usage controls.

## Dependencies

The backend dependencies declared in `backend/package.json` are:

- `express` — HTTP server, routing, and JSON middleware.
- `cors` — browser cross-origin response policy.
- `groq-sdk` — Groq API client.
- `@tavily/core` — Tavily search client.

The frontend uses native browser APIs and loads Tailwind CSS v4's browser
package from jsDelivr in `frontend/index.html`.
