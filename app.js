const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const path = require('path')

// Configure Express
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'Public')))

// Define routes
app.get('/', (req, res) => {
    res.render('index')
})

// Start server in development environment
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Traaker server running on port ${port}`)
    })
}

// Export for serverless use
module.exports = app

