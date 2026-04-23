# Website Grammar Checker

A full-stack web application that scrapes any website and checks its content for grammar and spelling errors using LanguageTool API.

## Tech Stack

- **Frontend**: React (functional components, hooks)
- **Backend**: Node.js + Express
- **Scraping**: Puppeteer
- **Grammar Check**: LanguageTool Public API

## Features

✅ Enter any website URL  
✅ Scrape visible text content  
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
