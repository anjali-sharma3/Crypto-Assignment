const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/cryptoDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// schema and model
const priceSchema = new mongoose.Schema({
  name: String,
  price: Number,
  timestamp: { type: Date, default: Date.now }
});

const Price = mongoose.model('Price', priceSchema);

app.use(cors());
app.use(express.json());

// Function to generate fake prices
const cryptocurrencies = ["Bitcoin", "Ethereum", "Litecoin", "Ripple"];

const generateFakePrices = () => {
  return cryptocurrencies.map(name => ({
    name,
    price: parseFloat((Math.random() * (50000 - 100) + 100).toFixed(2)) // Random price between $100 and $50,000
  }));
};

// Store new prices in the database every 10 seconds
setInterval(async () => {
  const fakePrices = generateFakePrices();
  await Price.insertMany(fakePrices);
}, 10000);

// Fetch the latest price for a specific crypto
app.get('/api/prices', async (req, res) => {
  const { crypto } = req.query;
  const latestPrice = await Price.findOne({ name: crypto.charAt(0).toUpperCase() + crypto.slice(1) })
    .sort({ timestamp: -1 });
  res.json({ data: latestPrice });
});

// Fetch historical prices within a date range for a specific crypto
app.get('/api/prices/:crypto', async (req, res) => {
  const { crypto } = req.params;
  const { start, end } = req.query;
  const startDate = new Date(start);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  const historicalPrices = await Price.find({
    name: crypto.charAt(0).toUpperCase() + crypto.slice(1),
    timestamp: { $gte: startDate, $lt: endDate }
  }).sort({ timestamp: 1 });

  res.json({ data: historicalPrices });
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});