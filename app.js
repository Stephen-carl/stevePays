const express = require('express')
const app = express();
require('dotenv').config();
const cors = require('cors')
const routes = require('./routes/payout')


app.use(cors({origin: "*",}));
app.use(express.json())
app.use(express.urlencoded({extended: false})) 
app.use('/', routes);


//server
const port = process.env.PORT || 3030
app.listen(port, ()=> {
    console.log(`Server listening on port ${port}`);
});