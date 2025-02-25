import http from "http"
import path from "path"
import fs from "fs"

const CONFIG = {
  port: 80,
  rootDirectory: import.meta.dirname,
  accessHiddenFiles: false,
  indexFiles: ["index.html", "index.htm"],
  bytesPerUnit: 1024,
  sizeUnits: ["b", "Kb", "Mb", "Gb", "Tb", "Pb"]
}

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin"
}

const MIME_TYPES = {
  // HTML, CSS, JS
  ".html": "text/html", ".htm": "text/html", ".css": "text/css",
  ".js": "application/javascript", ".mjs": "application/javascript",
  ".json": "application/json", ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
  
  // Images
  ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp",
  ".ico": "image/x-icon",
  
  // Documents
  ".pdf": "application/pdf", ".md": "text/markdown", ".txt": "text/plain",
  ".rtf": "application/rtf", ".csv": "text/csv", ".log": "text/log",
  
  // Source code
  ".py": "text/x-python", ".rb": "text/x-ruby", ".sh": "text/x-shellscript",
  ".php": "text/x-php", ".java": "text/x-java", ".ts": "text/x-typescript",
  
  // Archives and media
  ".zip": "application/zip", ".gz": "application/gzip", ".tar": "application/x-tar",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".mp4": "video/mp4",
  ".webm": "video/webm", ".ogg": "audio/ogg"
}

const STYLES = `
  :root {
    --background-color: #fff;
    --background-color-hover: #f6f6f6;
    --background-color-alternate: #fafafa;
    --title-color: #6f747a;
    --text-color: #626262;
    --link-color: #5b5b5b;
    --footer-link-color: #2a8de1;
    --border-color: #eceef1;
    --standard-font: -apple-system, system-ui, sans-serif;
    --mono-font: consolas,monospace;
    --width: 1100px;
    --spacing: 15px;
    --text-small: .8rem;
    --text-medium: .875rem;
    --text-large: 1.4rem;
    --icon-opacity: 0.7;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --background-color: #111827;
      --background-color-alternate: #172136;
      --background-color-hover: #1b2946;
      --border-color: #1c2841;
      --title-color: #bbb;
      --text-color: #ddd;
      --link-color: #ddd;
      --icon-opacity: 1;
    }
  }
  html,body { background: var(--background-color); min-height: 100%; margin: 0; font-family: var(--standard-font); overflow: auto; }
  body { border-top: var(--spacing) solid var(--border-color); }
  a { text-decoration: none; color: var(--footer-link-color); }
  footer { text-align: center; padding: var(--spacing); margin: var(--spacing) auto; font-size: var(--text-small); color: var(--text-color) }

  table {
    max-width: var(--width);
    margin: 60px auto 0;
    border-collapse: collapse;
    font-size: var(--text-medium);
    color: var(--text-color);
  }

  table caption {
    padding: 0 var(--spacing) var(--spacing);
    text-align: left;
    font-size: var(--text-large);
    max-width: var(--width);
    text-overflow: ellipsis;
    overflow: hidden;
    color: var(--text-color);
    font-weight: 100;
  }

  table caption a { color: var(--title-color); padding: 0 var(--spacing); font-weight: normal; }
  table caption a:first-child { padding-left: 0; }
  table caption a:last-child { font-weight: bold; }

  th {
    padding: var(--spacing);
    color: var(--title-color);
    font-size: var(--text-small);
    text-align: left;
  }

  tr th:first-child { width: 70%; }
  tr th:last-child { width: 5%; }

  tbody tr:nth-child(odd) { background: var(--background-color-alternate); }
  tbody tr:hover { background: var(--background-color-hover); }
  tr td { padding: 0 var(--spacing); }
  tr td:first-child { max-width: calc(var(--width)*0.7); text-overflow: ellipsis; overflow: hidden; }
  tr td:nth-child(2) { font-family: var(--mono-font); font-size: var(--text-small); }
  tr td:nth-child(3) { text-align: right; font-family: var(--mono-font); font-size: var(--text-small); }

  tr td:first-child a {
    display: block;
    height: 100%;
    padding: 12px 0;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    color: var(--link-color);
  }

  tbody a abbr {
    display: inline-block;
    margin-right: var(--spacing);
    position: relative;
    vertical-align: middle;
    border: 1.5px solid;
    opacity: var(--icon-opacity);
  }

  tbody a abbr[data-ext="[PARENT]"],
  tbody a abbr[data-ext="[DIR]"] {
    width: 16px;
    margin-left: 2px;
    font-size: 0;
  }

  tbody a abbr[data-ext="[PARENT]"] { height: 16px; border-radius: 2px; }

  tbody a abbr[data-ext="[PARENT]"]:after {
    content: "";
    position: absolute;
    inset: 7px auto auto 5px;
    width: 5px;
    height: 5px;
    border: solid currentColor;
    border-width: 1.5px 0 0 1.5px;
    transform: rotate(45deg);
  }

  tbody a abbr[data-ext="[DIR]"] { height: 12px; border-radius: 0 2px 2px 2px; }

  tbody a abbr[data-ext="[DIR]"]:after {
    content: "";
    position: absolute;
    width: 8px;
    height: 2px;
    margin: -4px 0 0 -1px;
    border: 1.5px solid currentColor;
    border-bottom: 0;
    border-radius: 2px 2px 0 0;
  }

  tbody a abbr:not([data-ext="[PARENT]"]):not([data-ext="[DIR]"]) {
    min-width: 20px;
    padding: 1px 2px;
    border-radius: 4px;
    font-size: 0.6rem;
    text-align: center;
    text-transform: uppercase;
  }
  tbody a abbr:not([data-ext="[PARENT]"]):not([data-ext="[DIR]"]):after { content: attr(data-ext) }
`

const getColor = (label, lightness = 65, chroma = 70) => {
  let hash = 0
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
    hash *= label.charCodeAt(i)
  }
  return `lch(${lightness}% ${chroma} ${hash % 360})`
}

const formatSize = (bytes) => {
  if (bytes === 0) return `0 ${CONFIG.sizeUnits[0]}`
  const exp = Math.floor(Math.log(bytes) / Math.log(CONFIG.bytesPerUnit))
  const value = (bytes / Math.pow(CONFIG.bytesPerUnit, exp)).toFixed(1).replace(".0", "")
  return `${value}&nbsp;${CONFIG.sizeUnits[exp]}`
}

const getFileInfo = (filePath) => {
  const stats = fs.lstatSync(filePath)
  const fileName = path.basename(filePath)
  const relativePath = filePath.slice(CONFIG.rootDirectory.length)
  const isDirectory = stats.isDirectory()

  return {
    name: fileName,
    path: encodeURI(relativePath),
    size: formatSize(stats.size),
    ext: isDirectory ? "[DIR]" : path.extname(filePath).slice(1) || "∅",
    modified: new Date(stats.mtimeMs).toISOString().slice(0, 16).replace("T", " "),
    isDirectory
  }
}

const escapeHTML = (text) => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

const renderDirectory = (dirPath) => {
  const relativePath = dirPath.slice(CONFIG.rootDirectory.length)
  const parts = relativePath.split("/").filter(Boolean)
  const breadcrumbs = [
    '<a href="/">Home</a>',
    ...parts.map((folder, i) => {
      const url = "/" + parts.slice(0, i + 1).join("/")
      return `<a href="${url}">${folder}</a>`
    })
  ].join(" / ")

  const files = fs
    .readdirSync(dirPath)
    .filter((file) => CONFIG.accessHiddenFiles || !file.startsWith("."))
    .map((file) => getFileInfo(path.join(dirPath, file)))
    .sort((a, b) => b.isDirectory - a.isDirectory || a.name.localeCompare(b.name))
    .map((file) => {
      const color = getColor(file.ext)
      return `
        <tr>
          <td>
            <a href="${file.path}" title="${escapeHTML(file.name)}">
              <abbr data-ext="${escapeHTML(file.ext)}" style="border-color:${color};color:${color}">${file.isDirectory ? "[DIR] " : ""}</abbr>${escapeHTML(file.name)}
            </a>
          </td>
          <td><time>${file.modified}</time></td>
          <td>${file.isDirectory ? "-" : file.size}</td>
        </tr>
      `
    })
    .join("")
  const parentRow =
    dirPath !== CONFIG.rootDirectory
      ? `
    <tr>
      <td colSpan="3">
        <a href="../">
          <abbr data-ext="[PARENT]" style="border-color:${getColor("[PARENT]")};color:${getColor("[PARENT]")}">[PARENT]</abbr>Parent directory
        </a>
      </td>
    </tr>
  `
      : ""

  return `
    <!DOCTYPE html>
    <html lang="en" dir="ltr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Index of ${relativePath || "/"}</title>
        <link rel="icon" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9Im5vbmUiPjwvc3ZnPg==">
        <style>${STYLES}</style>
      </head>
      <body>
        <table>
          <caption>${breadcrumbs}</caption>
          <thead>
            <tr><th>Name</th> <th>Last modified</th> <th>Size</th></tr>
          </thead>
          <tbody>
            ${parentRow}
            ${files}
          </tbody>
        </table>
        <footer><a href="https://github.com/Cugniere/nodini">Nodini</a> developed by Cugniere</footer>
      </body>
    </html>
  `
}

const isPathSafe = (requestPath, rootDirectory) => path.resolve(requestPath).startsWith(path.resolve(rootDirectory))
const isSensitive = (requestPath) => !CONFIG.accessHiddenFiles && requestPath.split(path.sep).some((part) => part.startsWith("."))

const handleRequest = (req, res) => {
  try {
    const decodedUrl = decodeURIComponent(req.url)
    const requestPath = path.resolve(path.join(CONFIG.rootDirectory, decodedUrl))

    if (!isPathSafe(requestPath, CONFIG.rootDirectory) || isSensitive(requestPath)) {
      return res.writeHead(403, SECURITY_HEADERS).end("Forbidden")
    } else if (!fs.existsSync(requestPath)) return res.writeHead(404, SECURITY_HEADERS).end("Not Found")

    const isDirectory = fs.lstatSync(requestPath).isDirectory()

    if (isDirectory) {
      if (!decodedUrl.endsWith("/")) {
        return res
          .writeHead(301, {
            Location: `${decodedUrl}/`,
            "Content-Type": "text/html",
            ...SECURITY_HEADERS
          })
          .end(`Redirecting to <a href="${decodedUrl}/">${decodedUrl}/</a>`)
      }

      for (const indexFile of CONFIG.indexFiles) {
        const indexPath = path.join(requestPath, indexFile)
        if (fs.existsSync(indexPath) && isPathSafe(indexPath, CONFIG.rootDirectory)) {
          return serveFile(indexPath, res)
        }
      }

      return res
        .writeHead(200, {
          "Content-Type": "text/html",
          ...SECURITY_HEADERS,
          "Content-Security-Policy": "default-src 'none'; style-src 'self' 'unsafe-inline';"
        })
        .end(renderDirectory(requestPath))
    }

    serveFile(requestPath, res)
  } catch (error) {
    console.error(`Error: ${error.message}`)
    res.writeHead(500, SECURITY_HEADERS).end("Internal Server Error")
  }
}

const serveFile = (filePath, res) => {
  const ext = path.extname(filePath).toLowerCase()
  const contentType = MIME_TYPES[ext] || "application/octet-stream"

  fs.access(filePath, fs.constants.R_OK, (error) => {
    if (error) return res.writeHead(404, SECURITY_HEADERS).end("Not Found")

    res.writeHead(200, {
      "Content-Type": `${contentType}; charset=UTF-8`,
      ...SECURITY_HEADERS
    })
    fs.createReadStream(filePath).pipe(res)
  })
}

http.createServer(handleRequest).listen(CONFIG.port, () => {
  console.log(`Local server running http://localhost:${CONFIG.port}`)
})

