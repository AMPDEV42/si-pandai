import fs from 'fs';
import path from 'path';

export default function handleVisualEditor() {
  return {
    name: 'handle-visual-editor',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Check if the request is for the visual editor plugin
        if (req.url.includes('/dashboard/plugins/visual-editor/')) {
          const filePath = path.join(
            __dirname,
            'plugins/visual-editor',
            req.url.split('/dashboard/plugins/visual-editor/')[1]
          );

          // Check if the file exists
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/javascript');
            res.end(content);
          } else {
            // If file doesn't exist, return empty content
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/javascript');
            res.end('// Visual editor plugin file not found');
          }
          return;
        }
        next();
      });
    }
  };
}
