const express = require('express')
const app = express();
require('dotenv').config();
const routes = require('./routes/payout')

app.use(express.json())
app.use(express.urlencoded({extended: false})) 
app.use('/', routes);


//server
const port = process.env.PORT || 3030
app.listen(port, ()=> {
    console.log(`Server listening on port ${port}`);
});