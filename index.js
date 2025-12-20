// Imports
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
dotenv.config();

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())


const port = process.env.PORT || 3000

app.get('/', (req, res) => {
    res.send({'msg': 'Server is Running'})
})


app.listen(port, () => {
    console.log('Server listening on port', port);

})