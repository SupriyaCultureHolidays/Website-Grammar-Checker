# Website Grammar Checker

A full-stack web application that scrapes any website and checks its content for grammar and spelling errors using LanguageTool API.

## Tech Stack

- **Frontend**: React (functional components, hooks)
- **Backend**: Node.js + Express
- **Scraping**: Puppeteer
- **Grammar Check**: LanguageTool Public API

## Features

✅ Enter any website URL  
✅ Scrape visible text content  Recognized
✅ Check grammar and spelling with LanguageTool  
✅ Display results in a clean table  
✅ Export results as CSV  
✅ Responsive design  
✅ Loading states and error handling  

## Project Structure

```
Website Grammar Checker/
├── server/           # Node.js + Express backend
│   ├── index.js      # Main server file
│   └── package.json
└── client/           # React frontend
    ├── src/
    │   ├── App.js
    │   ├── App.css
    │   ├── index.js
    │   └── index.css
    └── package.json
```

## Installation & Setup

### 1. Install Server Dependencies

```bash
cd server
npm install
```

### 2. Client is Already Set Up

The React app was scaffolded with create-react-app and dependencies are already installed.

## Running the Application

### Start the Backend Server

```bash
cd server
npm start
```

Server will run on **http://localhost:5000**

### Start the React Frontend

Open a new terminal:

```bash
cd client
npm start
```

Frontend will run on **http://localhost:3000**

## Usage

1. Open **http://localhost:3000** in your browser
2. Enter a website URL (e.g., `https://example.com`)
3. Click **Check** button
4. Wait for the scraping and grammar check to complete
5. View results in the table
6. Click **Export CSV** to download results

## API Endpoint

### POST /check-website

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "issues": [
    {
      "wrong": "teh",
      "suggestion": "the",
      "sentence": "This is teh example sentence."
    }
  ],
  "total": 1
}
```

## Error Handling

- Invalid URL validation
- Puppeteer timeout (30s)
- LanguageTool API rate limiting
- Empty page content detection
- Network errors

## Features Implemented

✅ URL input with validation  
✅ Loading spinner during processing  
✅ Results table with 3 columns (Wrong Text, Suggestion, Sentence)  
✅ Total issue count display  
✅ "No errors found" message  
✅ CSV export functionality  
✅ Responsive design  
✅ Text chunking for large content (4000 chars per chunk)  
✅ Error handling for timeouts and API failures  

## Notes

- Uses LanguageTool public API (free tier with rate limits)
- Scrapes only visible text using `document.body.innerText`
- Handles large text by splitting into chunks
- Single-page analysis only (no crawling)
- No authentication required

## Development

To run server with auto-reload:

```bash
cd server
npm install -g nodemon
npm run dev
```

## Troubleshooting

**Puppeteer Issues on Windows:**
- Ensure you have the latest Chrome/Chromium installed
- If Puppeteer fails to download Chromium, run: `npm install puppeteer --force`

**CORS Errors:**
- Ensure backend is running on port 5000
- Check that frontend is making requests to `http://localhost:5000`

**Rate Limiting:**
- LanguageTool public API has rate limits
- Wait a few minutes between large requests

---

## Industry-Level Improvements

### 🔴 Security (High Priority)

**1. SSRF — Server-Side Request Forgery**
- Current `isValidUrl` only checks `http/https` protocol
- Attackers can pass internal IPs like `http://127.0.0.1` or `http://169.254.169.254` (AWS metadata)
- Fix: Block private/internal IP ranges before making any request

```js
const BLOCKED_HOSTS = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/;

function isValidUrl(string) {
  try {
    const url = new URL(string);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (BLOCKED_HOSTS.test(url.hostname)) return false;
    return true;
  } catch { return false; }
}
```

**2. CSRF — Cross-Site Request Forgery Protection Missing**
- No CSRF protection on the POST `/check-website` endpoint
- Fix: Add `helmet` for security headers and `express-rate-limit` per IP

```bash
npm install helmet express-rate-limit
```

```js
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

app.use(helmet());
app.use("/check-website", rateLimit({ windowMs: 60_000, max: 10 }));
```

**3. Insecure CORS Policy**
- `app.use(cors())` allows all origins (`*`)
- Fix: Restrict to your frontend origin only

```js
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000" }));
```

**4. Error Details Leaked to Client**
- `err.message` is sent directly in the response, exposing internals
- Fix: Log internally, return a generic message

```js
// ❌ current
res.status(500).json({ error: "Something went wrong. " + err.message });

// ✅ fixed
console.error(err);
res.status(500).json({ error: "Internal server error." });
```

---

### 🟡 Performance & Reliability (Medium Priority)

**5. No Puppeteer Concurrency Control**
- Multiple simultaneous requests will spawn multiple Puppeteer instances and crash the server
- Fix: Use `p-queue` to limit concurrency

```bash
npm install p-queue
```

```js
const PQueue = require("p-queue").default;
const queue = new PQueue({ concurrency: 2 });

// inside route handler:
const text = await queue.add(() => scrapeText(url));
```

**6. No Delay Between LanguageTool Chunk Requests**
- Public API rate-limits per second; rapid chunk requests will get blocked
- Fix: Add a small delay between chunks

```js
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

for (const chunk of chunks) {
  // ... axios call
  await delay(500);
}
```

**7. No Input Length Cap**
- A very large scraped page will overload the grammar API
- Fix: Cap the text length after scraping

```js
const MAX_TEXT_LENGTH = parseInt(process.env.MAX_TEXT_LENGTH) || 50000;
const trimmed = text.slice(0, MAX_TEXT_LENGTH);
```

---

### 🟢 Code Quality & Observability (Low Priority)

**8. No Structured Logging**
- `console.error` is not suitable for production
- Fix: Use `winston` or `pino` for structured, leveled logging

```bash
npm install pino
```

**9. No Health Check Endpoint**
- Add a `/health` endpoint for uptime monitoring and load balancer checks

```js
app.get("/health", (req, res) => res.json({ status: "ok" }));
```

**10. No `.env.example` File**
- New developers don't know what environment variables are required
- Fix: Add a `.env.example` file

```
PORT=5000
ALLOWED_ORIGIN=http://localhost:3000
LANGUAGETOOL_URL=https://api.languagetool.org/v2/check
CHUNK_SIZE=4000
PUPPETEER_TIMEOUT=30000
MAX_TEXT_LENGTH=50000
```

---

### Summary

| Area | Issue | Priority |
|------|-------|----------|
| Security | SSRF via internal IPs | 🔴 High |
| Security | CSRF protection missing | 🔴 High |
| Security | CORS too permissive | 🔴 High |
| Security | Error details leaked to client | 🟡 Medium |
| Performance | No Puppeteer concurrency limit | 🔴 High |
| Reliability | No delay between API chunk requests | 🟡 Medium |
| Reliability | No input length cap | 🟡 Medium |
| Observability | No structured logging | 🟢 Low |
| Observability | No health check endpoint | 🟢 Low |
| Developer UX | No `.env.example` file | 🟢 Low |
