import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read config safely
const firebaseConfig = JSON.parse(
  readFileSync(path.join(__dirname, 'firebase-applet-config.json'), 'utf8')
);

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: firebaseConfig.storageBucket
  });
}

const defaultBucketName = admin.storage().bucket().name;
console.log(`Server: Firebase initialized. Default bucket: ${defaultBucketName}`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  const apiRouter = express.Router();

  apiRouter.use(express.json());
  apiRouter.use(express.urlencoded({ extended: true }));

  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Catch-all 404 for API routes
  apiRouter.all("*", (req, res) => {
    console.warn(`Server API: 404 on ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
  });

  // Mount API router FIRST
  app.use("/api", apiRouter);

  // Vite middleware for development
  console.log(`Server: Starting in ${process.env.NODE_ENV || 'development'} mode`);
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: process.cwd()
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Global error handler for Express - must be last
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Express Error:", err);
    if (req.url.startsWith('/api/')) {
      return res.status(err.status || 500).json({
        error: err.message || "Internal Server Error",
        url: req.url
      });
    }
    next(err);
  });
}

startServer();
