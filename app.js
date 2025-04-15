const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const path = require('path')

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
    res.render('index')
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


