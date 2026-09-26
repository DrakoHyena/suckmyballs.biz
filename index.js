const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 3069;
const PUBLIC_DIR = path.resolve(__dirname, 'public');

// MIME types for static assets
const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=UTF-8',
};

/**
 * Validates and safely resolves a file path within the PUBLIC_DIR.
 * Prevents Directory Traversal / Snooping vulnerabilities.
 */
function getSafeFilePath(urlPath) {
    try {
        // 1. Decode URI to handle percent-encoded characters (e.g. %2e%2e -> ..)
        const decodedPath = decodeURIComponent(urlPath);

        // 2. Strip null-byte characters to prevent null-byte injection attacks
        const sanitizedPath = decodedPath.replace(/\0/g, '');

        // 3. Resolve path relative to PUBLIC_DIR
        const safePath = path.resolve(PUBLIC_DIR, '.' + sanitizedPath);

        // 4. Ensure the resolved path strictly resides inside PUBLIC_DIR
        const relative = path.relative(PUBLIC_DIR, safePath);
        const isInsidePublicDir = relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));

        if (!isInsidePublicDir) {
            return null; // Path traversal attempt detected
        }

        return safePath;
    } catch (err) {
        return null; // Malformed URI / Bad Request
    }
}

const server = http.createServer(async (req, res) => {
    const baseURL = `http://${req.headers.host || 'localhost'}`;
    const parsedUrl = new URL(req.url, baseURL);
    const pathname = parsedUrl.pathname;

    if (pathname === '/balls' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
        return res.end("balls");
    } else if (pathname === "/articleIndex" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });

        const arrOut = [];

        const files = fs.readdirSync(`${PUBLIC_DIR}/news-articles/`)
        for (let file of files) {
            let text = fs.readFileSync(`${PUBLIC_DIR}/news-articles/${file}`, "UTF8").replaceAll("#", "").split("\n")
            const entry = {
                name: text[0].trim(),
                desc: text[1].trim(),
                date: text[2].trim(),
                auth: text[3].trim(),
                fileName: file
            }
            arrOut.push(entry)
        }

        return res.end(JSON.stringify(arrOut))
    } else if (pathname.split("?")[0] === "/article-viewer" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "text/html; charset=UTF-8" });
        return res.end(fs.readFileSync(`${PUBLIC_DIR}/articleViewer.html`));
    } else if (pathname === "/news" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "text/html; charset=UTF-8" });
        return res.end(fs.readFileSync(`${PUBLIC_DIR}/news.html`));
    }

    // ==========================================
    // 2. STATIC FILE SERVING (With Anti-Snooping)
    // ==========================================

    // Default root '/' to '/index.html'
    const targetPath = pathname === '/' ? '/index.html' : pathname;
    const filePath = getSafeFilePath(targetPath);

    // If path traversal was attempted or path is invalid
    if (!filePath) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
        return res.end('403 Forbidden: Access Denied');
    }

    // Check file existence and metadata
    fs.stat(filePath, (err, stats) => {
        // File does not exist
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
            return res.end('404 Not Found');
        }

        // If target is a directory, avoid directory listing (prevent snooping)
        if (stats.isDirectory()) {
            res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
            return res.end('403 Forbidden: Directory Listing Not Allowed');
        }

        // Serve the static file
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(filePath);

        stream.on('error', () => {
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
            }
            res.end('500 Internal Server Error');
        });

        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
