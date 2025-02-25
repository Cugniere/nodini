# Nodini

Nodini is a lightweight, single-file directory browser for Node.js. Build prototypes quickly without complex server setup.

![Nodini screenshot](../assets/nodini-screenshot.webp?raw=true)

## Features

- Zero dependencies - uses only Node.js built-in modules
- Clean directory listings with file type detection
- Security-focused - path traversal protection, hidden file handling
- Dark/light mode - follows system preference
- Responsive, accessible design
- Single file implementation (~10Kb)
- Minimal front-end - works without JavaScript, cookies, custom fonts or CSS frameworks

## Installation

1. Clone the repository `git clone https://github.com/Cugniere/nodini.git` or download `nodini.js`
2. Ensure Node.js is installed
3. No npm install needed!

## Usage

Run 
```bash
node nodini.js
```

Then visit http://localhost:80 in your browser.

## Configuration

Edit the `CONFIG` object at the top of the file:

```javascript
const CONFIG = {
  port: 80,                                      // Server port
  rootDirectory: import.meta.dirname,            // Root directory to serve
  accessHiddenFiles: false,                      // Allow access and show hidden files
  indexFiles: ["index.html", "index.htm"],       // Auto-serve these files in directories
  bytesPerUnit: 1024,                            // Bytes per unit for size formatting
  sizeUnits: ["b", "Kb", "Mb", "Gb", "Tb", "Pb"] // Size units
}
```

### Changing the port

By default, Nodini runs on port `80` for local use.

To use another port, simply replace `port: 80` with your preferred value.

### Changing the root directory

By default, Nodini serves the directory containing the script file.

To serve a different folder, update `rootDirectory`, for example:

```javascript
rootDirectory: "/var/www/"
```

### Display and access hidden files

Following Unix convention, files and folders starting with a dot (e.g., `.git`, `.env`, `.DS_Store`) are hidden.

By default, hidden files and their contents aren't shown or accessible.

To enable hidden files, set:

```javascript
accessHiddenFiles: true
```

### Changing Nodini's design

Nodini features a minimalist design that follows accessibility best practices.

Modify the `STYLES` variable in the code to customize the appearance.

Note: Nodini remains fully functional even without styling.

## Security considerations

Nodini includes security features that:
- Prevent access outside the root directory
- Protect against XSS attacks via URLs or filenames
- Disable client-side JavaScript in directory listings
- Prevent external resource loading in directory pages

Nodini is safe for personal use on local machines but **use caution in production environments and avoid direct internet exposure**.

Recommended deployment options:
- **Deploy behind a secure reverse proxy** with proper file permissions
- **Use containerization**


Docker example:

1. Set `rootDirectory` to `"/data"`
2. Create this Dockerfile:
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY nodini.js .
ENV NODE_ENV=production
VOLUME /data
EXPOSE 80
CMD ["node", "nodini.js"]
```
3. Build: `docker build -t nodini .`
4. Run: `docker run -p 8080:80 -v /path/to/local/directory:/data nodini`


## Credits

This project is inspired by nostalgic memories of browsing directory listings online via `intitle:"index of"` queries and simple file sharing.

Special thanks to [Apaxy](https://oupala.github.io/apaxy/) by [Adam Whitcroft](https://adamwhitcroft.com/) which inspired Nodini's design.


## License

MIT License - freely use and modify this code in your projects!

## Author

Developed by [Cugniere](https://github.com/Cugniere)