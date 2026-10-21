import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function feedbackApiPlugin(): Plugin {
  return {
    name: 'feedback-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/feedback', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              const developerEmail = process.env.DEVELOPER_EMAIL || 'sharemailac@gmail.com';
              const feedbackEntry = {
                id: data.id || `fb-${Date.now()}`,
                timestamp: new Date().toISOString(),
                name: data.name || 'Anonymous',
                topic: data.topic || 'General Feedback',
                contactEmail: data.contactEmail || data.contact || '',
                feedback: data.feedback || data.message || '',
              };

              // Persist locally in container data folder
              const dataDir = path.resolve(__dirname, 'data');
              if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
              }
              const feedbacksPath = path.resolve(dataDir, 'feedbacks.json');
              let existing: any[] = [];
              if (fs.existsSync(feedbacksPath)) {
                try {
                  existing = JSON.parse(fs.readFileSync(feedbacksPath, 'utf8'));
                } catch {
                  existing = [];
                }
              }
              existing.unshift(feedbackEntry);
              fs.writeFileSync(feedbacksPath, JSON.stringify(existing, null, 2));

              // Forward email notification to developer mailbox in server background
              try {
                await fetch(`https://formsubmit.co/ajax/${developerEmail}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Referer': 'https://currency-counter.ai.studio',
                    'Origin': 'https://currency-counter.ai.studio'
                  },
                  body: JSON.stringify({
                    _subject: `[Currency Counter Feedback] ${feedbackEntry.topic} from ${feedbackEntry.name}`,
                    _replyto: feedbackEntry.contactEmail,
                    _template: 'table',
                    _captcha: 'false',
                    Sender_Name: feedbackEntry.name,
                    User_Email: feedbackEntry.contactEmail,
                    Category: feedbackEntry.topic,
                    Feedback_Message: feedbackEntry.feedback,
                    App: 'Currency Counter',
                    Timestamp: feedbackEntry.timestamp
                  })
                });
              } catch (relayErr) {
                console.error('Server email relay error:', relayErr);
              }

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, message: 'Feedback safely submitted to developer' }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), feedbackApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
