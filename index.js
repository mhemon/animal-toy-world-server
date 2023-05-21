const express = require('express');
require('dotenv').config()
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
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

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access!' })
    }
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ error: true, message: 'unauthorized access!' })
        }
        req.decoded = decoded
        next();
    })
}


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect();

        const galleryCollection = client.db("animalToy").collection('gallery');

        const toyCollection = client.db("animalToy").collection('toy');

        // jwt
        app.post('/jwt', (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.SECRET_TOKEN, { expiresIn: '1h'});
            res.send({token})
        })

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

        app.get('/mytoys', verifyJWT, async (req, res) => {
            const decoded = req.decoded
            if (decoded.email !== req.query.email) {
                return res.status(403).send({ error: true, message: 'forbidden access!' })
            }
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

        app.post('/addtoys', verifyJWT, async (req, res) => {
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

