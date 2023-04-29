const express = require('express');
const port = process.env.PORT || 8080
const bodyParser = require('body-parser');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const mongoIO = require('./MongoIO');
const url = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/StockApp"
const mongoose = require('mongoose');
const Transaction = require('./Schema/Transaction')
const cors = require('cors');
// mongoose.connect('mongodb://localhost:27017/', { useNewUrlParser: true, useUnifiedTopology: true });
app.use(bodyParser.json());
app.use(cors())

const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}`)
})

// console.log(MongoClient)
// MongoClient.connect(url, async (err, client) => {
//     // console.log(client)
//     console.log(err)
//     const db = client.db('StockApp').collection("StockPrice");
//     const changeStream = await db.watch()
//     changeStream.on('change', (change) => {
//         const type = change.operationType;
//         if (type == "update" && change.updateDescription.updatedFields.fields !== undefined) {
//             const dataChange = {}
//             db.findOne(change.documentKey)
//                 .then((res) => {
//                     dataChange[res.stock] = res.fields.price
//                     io.emit("change-type", dataChange)
//                 })
//         }
//     })
// })
const dbConnection = require('./db');
dbConnection.connect();


app.post('/searchTransaction', async (req, res) => {
    const data = req.body;
    const db = await dbConnection.getDb();
    db.collection('Transactions').findOne({ "Stock Name": data['Stock Name'] })
        .then((result) => {
            res.status(200)
                .json({
                    result
                });
        })
})

app.get('/allStockPrice', async (req, res) => {
    const db = await dbConnection.getDb();
    db.collection("StockPrice").find().toArray((err, results) => {
        let stockMap = {}
        results.forEach((stock, i) => {
            stockMap = { ...stockMap, [stock["stock"]]: stock["fields"]["price"] }
        })
        res.send(stockMap)
    })
})

app.get('/allTransactions', async (req, res) => {
    const db = await dbConnection.getDb();
    // const db = client.db('StockApp');
    db.collection("Transactions").find().toArray((err, results) => {
        res.send(results)
    })
})

app.post('/addTransaction', async (req, res) => {
    const db = await dbConnection.getDb();
    const data = req.body;
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

app.get('/currentPrice',async (req, res) => {
    const db = await dbConnection.getDb();
    db.collection("StockPrice").find().toArray((err, results) => {
        if (err) {
            throw err;
        }
        res.send(results)
    })
})

app.post("/sellTransaction", async (req, res) => {
    const db = await dbConnection.getDb();
    const data = req.body;
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

app.get("/allDeposit", async (req, res) => {
    const db = await dbConnection.getDb();
    db.collection("Deposit").find().toArray((err, result) => {
        if (err) {
            throw err;
        }
        res.send(result);
    })
})

app.post("/addDeposit", async (req, res) => {
    const db = await dbConnection.getDb();
    const data = req.body;
    mongoIO.depositMoney(db, () => {
        res.status(200)
            .json({
                data
            })
    }, data)
})

app.get('/mostRecentDeposit', async (req, res) => {
    const db = await dbConnection.getDb();
    db.collection("Deposit").find().sort({ date: -1 }).limit(1).toArray((err, result) => {
        res.send(result)
    })
})

app.post('/buyPower', async (req, res) => {
    const db = await dbConnection.getDb();
    const data = req.body;
    mongoIO.buyPower(db, () => {
        res.status(200)
            .json({
                data
            })
    }, data)
})

app.get('/mostRecentBuyPower', async (req, res) => {
    const db = await dbConnection.getDb();
    db.collection("BuyPower").find().sort({ date: -1 }).limit(1).toArray((err, result) => {
        res.send(result)
    })
})

app.post("/tradeHistory", async (req, res) => {
    const db = await dbConnection.getDb();
    const data = req.body;
    mongoIO.tradeHistory(db, () => {
        res.status(200)
            .json({
                data
            })
    }, data)
})

app.get("/allTradeHistory", async (req, res) => {
    const db = await dbConnection.getDb();
    mongoIO.getAllTradeHistory(db, res);
})

app.post("/addInvesting", async (req, res) => {
    const db = await dbConnection.getDb();
    const data = req.body;
    mongoIO.addInvesting(db, () => {
        res.status(200)
            .json(data)
    }, data);
})

app.get("/allInvesting", async (req, res) => {
    const db = await dbConnection.getDb();
    mongoIO.getAllInvesting(db, res);
})

app.delete("/reset", async (req, res) => {
    const db = await dbConnection.getDb();
    mongoIO.resetEverything(db, res);
})