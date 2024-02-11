const express = require('express');
const router = express.Router();

const usersRouter = require('./users');
const productsRouter = require('./products');

router.use('/users', usersRouter);
router.use('/products', productsRouter);

router.get('/', (req,res) => {
    res.send('Welcome to the Vending Machine System');
})

module.exports = router;