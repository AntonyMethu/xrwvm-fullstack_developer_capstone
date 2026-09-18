const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = 3030;

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const reviews_data = JSON.parse(fs.readFileSync("data/reviews.json", 'utf8'));
const dealerships_data = JSON.parse(fs.readFileSync("data/dealerships.json", 'utf8'));

const Reviews = require('./review');
const Dealerships = require('./dealership');

const connectDB = async () => {
  const uri = "mongodb://host.docker.internal:27017/dealershipsDB";
  while (true) {
    try {
      console.log('Connecting to MongoDB via host gateway...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        family: 4
      });
      console.log("MongoDB connected successfully");
      
      await Reviews.deleteMany({});
      await Reviews.insertMany(reviews_data['reviews']);
      await Dealerships.deleteMany({});
      await Dealerships.insertMany(dealerships_data['dealerships']);
      console.log("Database seeded successfully");
      break;
    } catch (error) {
      console.error("MongoDB connection failed, retrying in 5 seconds...", error.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

connectDB();

// Express route to home
app.get('/', async (req, res) => {
    res.send("Welcome to the Mongoose API");
});

// Express route to fetch all reviews
app.get('/fetchReviews', async (req, res) => {
  try {
    const documents = await Reviews.find();
    res.json(documents);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: error.message });
  }
});

// Express route to fetch reviews by a particular dealer
app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try {
    const documents = await Reviews.find({ dealership: Number(req.params.id) });
    res.json(documents);
  } catch (error) {
    console.error("Error fetching reviews by dealer:", error);
    res.status(500).json({ error: error.message });
  }
});

// Express route to fetch all dealerships
app.get('/fetchDealers', async (req, res) => {
  try {
    const dealerships = await Dealerships.find();
    res.json(dealerships);
  } catch (error) {
    console.error("Error fetching dealerships:", error);
    res.status(500).json({ error: error.message });
  }
});

// Express route to fetch Dealers by a particular state
app.get('/fetchDealers/:state', async (req, res) => {
  try {
    const dealerships = await Dealerships.find({ state: req.params.state });
    res.json(dealerships);
  } catch (error) {
    console.error("Error fetching dealerships by state:", error);
    res.status(500).json({ error: error.message });
  }
});

// Express route to fetch dealer by a particular id
app.get('/fetchDealer/:id', async (req, res) => {
  try {
    const dealership = await Dealerships.findOne({ id: Number(req.params.id) });
    if (!dealership) {
      return res.status(404).json({ error: 'Dealer not found' });
    }
    res.json(dealership);
  } catch (error) {
    console.error("Error fetching dealer by ID:", error);
    res.status(500).json({ error: error.message });
  }
});

// Express route to insert review
app.post('/insert_review', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    let data = JSON.parse(req.body);
    const documents = await Reviews.find().sort({ id: -1 });
    let new_id = documents.length > 0 ? documents[0]['id'] + 1 : 1;

    const review = new Reviews({
      "id": new_id,
      "name": data['name'],
      "dealership": data['dealership'],
      "review": data['review'],
      "purchase": data['purchase'],
      "purchase_date": data['purchase_date'],
      "car_make": data['car_make'],
      "car_model": data['car_model'],
      "car_year": data['car_year'],
    });

    const savedReview = await review.save();
    res.json(savedReview);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});