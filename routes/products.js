const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const db = require("../sequelize/models");
const Product = db.Product;

//Get all products
router.get('/', async(req, res) => {
    try {
        const products = await Product.findAll();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
     }
});

//Create a new product
router.post('/', async(req, res) => {
    try{
        if(req.params.role  !== 'seller'){
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        const newProduct = await Product.create(req.body)
        res.status(201).json(newProduct);
    }
    catch(err){
        res.status(500).json({ error: err.message });
    }
});

//Update product details
router.put('/:id', async (req, res) => {
    try {
      const productId = req.params.id;
      const product = await Product.findByPk(productId);
  
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      // Check if the sellerId provided in the request parameters matches the sellerId of the product
      if (product.sellerId !== req.params.sellerId) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }
  
      await product.update(req.body);
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

//Delete Product
router.put('/:id', async (req, res) => {
    try {
      const productId = req.params.id;
      const product = await Product.findByPk(productId);
  
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      // Check if the sellerId provided in the request parameters matches the sellerId of the product
      if (product.sellerId !== req.params.sellerId) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }
  
      await product.destroy();
      res.json({ message: 'Product deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


module.exports = router;