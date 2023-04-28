const express = require('express');
const port = process.env.PORT || 8080
const bodyParser = require('body-parser');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const mongoIO = require('./MongoIO');
const url = process.env.DATABASE_URL || "mongodb://localhost:27017/StockApp"
const mongoose = require('mongoose');
const Transaction = require('./Schema/Transaction')
const cors = require('cors');
// mongoose.connect('mongodb://localhost:27017/', { useNewUrlParser: true, useUnifiedTopology: true });
app.use(bodyParser.json());
app.use(cors())
console.log("PORT " + process.env.PORT)
const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}`)
})
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const client = require('socket.io-client')
app.get('/', (req, res) => {
    res.send("Hello World!")
})

// console.log(MongoClient)
MongoClient.connect(url, async (err, client) => {
    // console.log(client)
    console.log(err)
    const db = client.db('StockApp').collection("StockPrice");
    const changeStream = await db.watch()
    changeStream.on('change', (change) => {
        const type = change.operationType;
        if (type == "update" && change.updateDescription.updatedFields.fields !== undefined) {
            const dataChange = {}
            db.findOne(change.documentKey)
                .then((res) => {
                    dataChange[res.stock] = res.fields.price
                    io.emit("change-type", dataChange)
                })
        }
    })
})

app.post('/searchTransaction', (req, res) => {
    MongoClient.connect(url, (err, client) => {
        if (err) {
            throw err;
        }
        const data = req.body;
        const db = client.db('StockApp');
        db.collection('Transactions').findOne({ "Stock Name": data['Stock Name'] })
            .then((result) => {
                res.status(200)
                    .json({
                        result
                    });
            })
    })
})

app.get('/allStockPrice', (req, res) => {
    MongoClient.connect(url, async (err, client) => {
        if (err) {
            throw err;
        }
        const data = {};
        const db = client.db("StockApp");
        // const cursor = db.collection("StockPrice").find();
        // await cursor.forEach((doc) => {
        //     data[doc['stock']] = doc['fields']['price']
        // })
        // res.send(data)
        db.collection("StockPrice").find().toArray((err, results) => {
            let stockMap = {}
            results.forEach((stock, i) => {
                stockMap = { ...stockMap, [stock["stock"]]: stock["fields"]["price"] }
            })
            res.send(stockMap)
        })
    })
})

app.get('/allTransactions', (req, res) => {
    MongoClient.connect(url, (err, client) => {
        if (err) {
            throw err;
        }
        const db = client.db('StockApp');
        db.collection("Transactions").find().toArray((err, results) => {
            res.send(results)
        })
    })
})

app.post('/addTransaction', (req, res) => {
    const data = req.body;
    MongoClient.connect(url, (err, client) => {
        let db = client.db('StockApp');
        db.collection('Transactions').findOne({ "Stock Name": data['Stock Name'] })
            .then((output) => {
                if (!!output) {
                    mongoIO.updateExistedStock(db, () => {
                        res.status(200)
                            .json({
                                data
                            });
                    }, output, data);
                }
                else {
                    mongoIO.insertTransaction(db, () => {
                        res.status(200)
                            .json({
                                data,
                            });
                    }, data);
                }
            });
        db.collection("StockPrice").findOne({ "stock": data["Stock Name"] })
            .then((res) => {
                if (!res) {
                    const newStock = {
                        "stock": data["Stock Name"],
                        "time": '',
                        "fields": {
                            "price": '',
                            "growth": '',
                        }
                    }
                    mongoIO.insertStockPrice(db, newStock);
                }
            })
    })
})

app.get('/currentPrice', (req, res) => {
    MongoClient.connect(url, (err, client) => {
        if (err) {
            throw err;
        }
        const db = client.db('StockApp')
        db.collection("StockPrice").find().toArray((err, results) => {
            if (err) {
                throw err;
            }
            res.send(results)
        })
    })
})

app.post("/sellTransaction", (req, res) => {
    const data = req.body;
    MongoClient.connect(url, (err, client) => {
        if (err) {
            throw err;
        }
        const db = client.db("StockApp");
        db.collection("Transactions").findOne({ "Stock Name": data["Stock Name"] })
            .then((output) => {
                mongoIO.sellTransaction(db, () => {
                    res.status(200)
                        .json({
                            data
                        })
                }, output, data)
            })
    })
})

app.get("/allDeposit", (req, res) => {
    MongoClient.connect(url, (err, client) => {
        if (err) {
            throw err;
        }
        const db = client.db("StockApp");
        db.collection("Deposit").find().toArray((err, result) => {
            if (err) {
                throw err;
            }
            res.send(result);
        })
    })
})

app.post("/addDeposit", (req, res) => {
    const data = req.body;
    MongoClient.connect(url, (err, client) => {
        if (err) {
            console.log(err);
        }
        const db = client.db("StockApp");
        mongoIO.depositMoney(db, () => {
            res.status(200)
                .json({
                    data
                })
        }, data)
    })
})

app.get('/mostRecentDeposit', (req, res) => {
    MongoClient.connect(url, (err, client) => {
        if (err) {
            res.send(err);
        }
        const db = client.db("StockApp")
        db.collection("Deposit").find().sort({ date: -1 }).limit(1).toArray((err, result) => {
            res.send(result)
        })
    })
})

app.post('/buyPower', (req, res) => {
    const data = req.body;
    MongoClient.connect(url, (err, client) => {
        if (err) {
            console.log(err);
        }
        const db = client.db("StockApp");
        mongoIO.buyPower(db, () => {
            res.status(200)
                .json({
                    data
                })
        }, data)
    })
})

app.get('/mostRecentBuyPower', (req, res) => {
    MongoClient.connect(url, (err, client) => {
        if (err) {
            res.send(err);
        }
        const db = client.db("StockApp")
        db.collection("BuyPower").find().sort({ date: -1 }).limit(1).toArray((err, result) => {
            res.send(result)
        })
    })
})

app.post("/tradeHistory", (req, res) => {
    const data = req.body;
    MongoClient.connect(url, (err, client) => {
        if (err) {
            console.log(err);
        }
        const db = client.db("StockApp");
        mongoIO.tradeHistory(db, () => {
            res.status(200)
                .json({
                    data
                })
        }, data)
    })
})

app.get("/allTradeHistory", (req, res) => {
    MongoClient.connect(url, async (err, client) => {
        if (err) {
            console.log(err);
        }
        let data = {}
        const db = client.db("StockApp");
        mongoIO.getAllTradeHistory(db, res);
    })
})

app.post("/addInvesting", (req, res) => {
    MongoClient.connect(url, async (err, client) => {
        if (err) {
            console.log(err);
        }
        const db = client.db("StockApp");
        const data = req.body;
        mongoIO.addInvesting(db, () => {
            res.status(200)
                .json(data)
        }, data);
    })
})

app.get("/allInvesting", (req, res) => {
    MongoClient.connect(url, async (err, client) => {
        if (err) {
            console.log(err);
        }
        const db = client.db("StockApp");
        mongoIO.getAllInvesting(db, res);
    })
})