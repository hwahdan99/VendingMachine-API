const express = require('express');
const bodyParser = require('body-parser');
const mainRouter = require('./routes/index');

const app = express();
app.set('view engine', 'ejs')

app.use(bodyParser.json());
app.use('/',mainRouter);


app.listen(3000, (req, res) => { 
    console.log("App is running on port 3000") 
})