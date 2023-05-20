const express = require('express');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ntvgsob.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect();

        const galleryCollection = client.db("animalToy").collection('gallery');

        const toyCollection = client.db("animalToy").collection('toy');

        app.get('/gallery', async (req, res) => {
            const cursor = galleryCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/category', async (req, res) => {
            const subcat = req.query.subcategory
            const cursor = toyCollection.find({ "subCategory": subcat });
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/alltoys', async (req, res) => {
            const limit = parseInt(req.query.limit) || 20;
            const cursor = toyCollection.find().limit(limit);
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/mytoys', async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { sellerEmail: req.query.email }
            }

            let sort = {};
            if (req.query?.sort === 'ascending') {
                sort = { price: 1 };
            } else if (req.query?.sort === 'descending') {
                sort = { price: -1 };
            }

            const result = await toyCollection.find(query).sort(sort).toArray();
            res.send(result);
        })



        app.patch('/mytoys/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedToy = req.body;
            console.log(updatedToy);
            const updateDoc = {
                $set: {
                    price: updatedToy.price,
                    quantity: updatedToy.quantity,
                    details: updatedToy.details
                },
            };
            const result = await toyCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.get('/toy/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await toyCollection.findOne(query)
            res.send(result)
        })

        app.post('/addtoys', async (req, res) => {
            const added = req.body
            const result = await toyCollection.insertOne(added)
            res.send(result);
        })

        app.delete('/mytoys/:id', async (req, res) => {
            const id = req.params.id
            // console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await toyCollection.deleteOne(query)
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Animal Toy is running...')
})

app.listen(port, () => {
    console.log(`Animal toy listening on port ${port}`)
})

