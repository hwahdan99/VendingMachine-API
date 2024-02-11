const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const db = require("../sequelize/models");
const User = db.User;
const Product = db.Product;

//Create a new user
router.post('/', async(req, res) => {
    try{
        const newUser = await User.create(req.body);
        res.status(201).json(newUser);
    }
    catch (err){
        res.status(500).json({ error: err.message });
    }
});

//Update a user
router.put('/:id', async(req, res) => {
    try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    await user.update(req.body);
    res.json(user);
}
    catch(err){
        res.status(500).json({ error: err.message });
     }
});

router.delete('/:id', async(req, res) => {
    try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    await user.destroy();
    res.json({message: 'User deleted successfully'});
}
    catch(err){
        res.status(500).json({ error: err.message });
     }
});


// Deposit coins into the user's account (accessible by buyers)
router.post('/deposit', async (req, res) => {
    try {
      // Check if the user has the "buyer" role
      if (req.params.role !== 'buyer') {
        return res.status(403).json({ error: 'Only buyers can deposit coins' });
      }
  
      const { coins } = req.body;
  
      // Validate that coins array is provided in the request body
      if (!coins) {
        return res.status(400).json({ error: 'Invalid coins array' });
      }
  
      // Validate that each coin is one of 5, 10, 20, 50, or 100 cents
      const validCoins = [5, 10, 20, 50, 100];
      const invalidCoins = coins.filter(coin => !validCoins.includes(coin));
      if (invalidCoins.length > 0) {
        return res.status(400).json({ error: 'Invalid coins: ' + invalidCoins.join(', ') });
      }
  
      // Calculate the total deposit amount
      const totalDeposit = coins.reduce((acc, coin) => acc + coin, 0);
  
      // Update the user's deposit amount
      const user = await User.findOne(req.params.username);
      user.deposit += totalDeposit;
      await user.save();
  
      res.json({ message: 'Coins deposited successfully', totalDeposit });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


// Buy products with the deposited amount 
router.post('/buy', async (req, res) => {
    try {
      // Check if the authenticated user has the "buyer" role
      if (req.params.role !== 'buyer') {
        return res.status(403).json({ error: 'Only buyers can buy products' });
      }
  
      const { productId, quantity } = req.body;
  
      // Validate that productId and quantity are provided in the request body
      if (!productId || !quantity) {
        return res.status(400).json({ error: 'productId and quantity are required' });
      }
  
      // Find the product by productId
      const product = await Product.findByPk(productId);
  
      // Check if the product exists
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      // Check if the requested quantity is available
      if (quantity > product.amountAvailable) {
        return res.status(400).json({ error: 'Requested quantity exceeds available quantity' });
      }
  
      // Calculate the total cost of the purchase
      const totalCost = product.cost * quantity;
  
      // Find the buyer's user account
      const buyer = await User.findByPk(req.params.userId);

      if (!buyer) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Check if the buyer has enough deposit to make the purchase
      if (buyer.deposit < totalCost) {
        return res.status(400).json({ error: 'Insufficient funds in your account' });
      }
  
      // Update the product's quantity
      product.amountAvailable -= quantity;
      await product.save();
  
      // Deduct the total cost from the buyer's deposit
      buyer.deposit -= totalCost;
      await buyer.save();

      // Calculate the change
      let remainingChange = buyer.deposit;
      const changeDenominations = [100, 50, 20, 10, 5];
      const changeInCoins = {};

      for (const denomination of changeDenominations) {
        const numberOfCoins = Math.floor(remainingChange / denomination);
        if (numberOfCoins > 0) {
          changeInCoins[denomination] = numberOfCoins;
          remainingChange -= numberOfCoins * denomination;
        }
      }
  
      // Prepare the response data
      const purchasedProducts = {
        product: {
          id: product.productId,
          productName: product.productName,
          quantity: quantity,
          costPerItem: product.cost,
          totalCost: totalCost
        },
        change: changeInCoins
      };
  
      res.json({ message: 'Purchase successful', purchasedProducts });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// Reset the deposit for the buyers
router.post('/reset', async (req, res) => {
    try {
      // Check if the user is a buyer
      if (req.params.role !== 'buyer') {
        return res.status(403).json({ error: 'Only buyers can reset their deposit' });
      }
  
      // Find the user by their ID
      const user = await User.findByPk(req.params.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Reset the user's deposit to 0
      user.deposit = 0;
      await user.save();
  
      res.json({ message: 'Deposit reset successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;