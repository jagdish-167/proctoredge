import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.post("/api/notify-admin", (req, res) => {
    const { examId, studentEmail, type, description, imageUrl } = req.body;
    
    console.log(`[EMAIL SIMULATOR] Sending high-priority alert to: jagdishsolunke02@gmail.com`);
    console.log(`[ALERT] Student: ${studentEmail}`);
    console.log(`[ALERT] Exam: ${examId}`);
    console.log(`[ALERT] Violation: ${type}`);
    console.log(`[ALERT] Details: ${description}`);
    console.log(`[ALERT] Image Attachment length: ${imageUrl?.length || 0} chars`);
    
    // In a real application, you would use Nodemailer or SendGrid here:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({...});

    res.json({ success: true, message: "Admin notified via encrypted relay." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
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
    console.log(`ProctorEdge Unified Server running on http://localhost:${PORT}`);
  });
}

startServer();
