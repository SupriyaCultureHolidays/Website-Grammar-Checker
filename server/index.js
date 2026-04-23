require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const puppeteer = require("puppeteer");
const pino = require("pino");

const logger = pino({ transport: { target: "pino-pretty" } });

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000" }));
app.use(express.json());
app.use("/check-website", rateLimit({ windowMs: 60_000, max: 10 }));

const LANGUAGETOOL_URL = process.env.LANGUAGETOOL_URL || "https://api.languagetool.org/v2/check";
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE) || 4000;
const PUPPETEER_TIMEOUT = parseInt(process.env.PUPPETEER_TIMEOUT) || 30000;
const PORT = process.env.PORT || 5000;

const BLOCKED_HOSTS = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/;

function isValidUrl(string) {
  try {
    const url = new URL(string);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (BLOCKED_HOSTS.test(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

async function scrapeText(url) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(PUPPETEER_TIMEOUT);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const text = await page.evaluate(() => document.body.innerText);
    return text.replace(/\s+/g, " ").trim();
  } finally {
    await browser.close();
  }
}

function chunkText(text, size) {
  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = "";
  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length > size) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + " " + sentence : sentence;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks.length ? chunks : [text.slice(0, size)];
}

async function checkGrammar(text) {
  const chunks = chunkText(text, CHUNK_SIZE);
  const results = [];

  for (const chunk of chunks) {
    const params = new URLSearchParams({ text: chunk, language: "en-US" });
    const res = await axios.post(LANGUAGETOOL_URL, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 15000,
    });

    for (const match of res.data.matches) {
      const context = match.context;
      const wrong = context.text.slice(
        context.offset,
        context.offset + context.length
      );
      const suggestion =
        match.replacements.length > 0 ? match.replacements[0].value : "—";
      const sentence = context.text.trim();

      results.push({ wrong, suggestion, sentence });
    }
  }

  return results;
}

app.post("/check-website", async (req, res) => {
  const { url } = req.body;

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: "Invalid or missing URL." });
  }

  try {
    const text = await scrapeText(url);
    if (!text || text.length < 10) {
      return res.status(422).json({ error: "Could not extract text from the page." });
    }

    const issues = await checkGrammar(text);
    res.json({ issues, total: issues.length });
  } catch (err) {
    if (err.name === "TimeoutError" || err.message?.includes("timeout")) {
      return res.status(504).json({ error: "Page load timed out. Try another URL." });
    }
    if (err.response?.status === 429) {
      return res.status(429).json({ error: "LanguageTool rate limit reached. Please wait and try again." });
    }
    logger.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => logger.info(`Server running on http://localhost:${PORT}`));
