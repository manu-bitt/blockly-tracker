const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const path = require('path')
const fs = require('fs')

// Configure Express
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Serve static files with explicit path
app.use('/css', express.static(path.join(__dirname, 'Public/css')))
app.use('/js', express.static(path.join(__dirname, 'Public/js')))
app.use('/img', express.static(path.join(__dirname, 'Public/img')))
app.use(express.static(path.join(__dirname, 'Public')))

// Define routes
app.get('/', (req, res) => {
    try {
        // Check if we're in Vercel's serverless environment
        if (process.env.VERCEL) {
            console.log('Running in Vercel environment');
            
            // Try serving the HTML file directly instead of using EJS
            const htmlPath = path.join(__dirname, 'views', 'index.html');
            if (fs.existsSync(htmlPath)) {
                console.log('Serving index.html directly');
                return res.sendFile(htmlPath);
            } else {
                console.log('index.html not found at:', htmlPath);
            }
        }
        
        // Try rendering with EJS
        res.render('index');
    } catch (error) {
        console.error('Error rendering view:', error);
        
        // Try serving HTML directly as fallback
        try {
            const htmlPath = path.join(__dirname, 'views', 'index.html');
            if (fs.existsSync(htmlPath)) {
                console.log('Fallback to serving index.html directly');
                return res.sendFile(htmlPath);
            }
        } catch (fallbackError) {
            console.error('Fallback error:', fallbackError);
        }
        
        res.status(500).send('Error rendering view: ' + error.message);
    }
})

// Handle 404
app.use((req, res) => {
    res.status(404).send('Page not found')
})

// Start server in development environment
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Traaker server running on port ${port}`)
    })
}

// Export for serverless use
module.exports = app


