const e = require("express");

const insertTransaction = (db, callback, data) => {
    db.collection('Transactions').insertOne(data, (err, result) => {
        callback()
    })
}

const getAllTransactions = async (db, callback, data) => {
    const dataList = db.collection('Transactions').find().toArray((err, result) => {
        if (err) {
            throw err;
        }
        data = result
    })
    await dataList;
    callback()
};

const updateExistedStock = (db, callback, existedStock, data) => {
    data["Shares"] = parseFloat(existedStock["Shares"]) + parseFloat(data["Shares"]);
    data["Total"] = parseFloat(existedStock["Total"]) + parseFloat(data["Total"]);
    data["Price"] = parseFloat(data["Total"]) / parseFloat(data["Shares"]);
    const filter = { "Stock Name": data["Stock Name"] }
    const updateDoc = {
        $set: {
            "Shares": data["Shares"],
            "Price": data["Price"],
            "Total": data["Total"]
        },
    };
    db.collection('Transactions').updateOne(filter, updateDoc,
        (err, result) => {
            callback();
        })
}

const insertStockPrice = (db, data) => {
    db.collection("StockPrice").insertOne(data, (err, res) => {
        if (err) {
            throw err;
        }
    })
}

const sellTransaction = (db, callback, existedStock, data) => {
    data["Shares"] = parseFloat(existedStock["Shares"]) - parseFloat(data["Shares"]);
    data["Total"] = parseFloat(existedStock["Total"]) - parseFloat(data["Total"]);
    const filter = { "Stock Name": data["Stock Name"] }
    if (data["Shares"] == 0) {
        db.collection("Transactions").deleteOne(filter, (err, res) => {
            if (err) {
                throw (err);
            }
            callback();
        })
        db.collection("StockPrice").deleteOne({ "stock": data["Stock Name"] }, (err, res) => {
            if (err) {
                throw (err);
            }
        })
    }
    else {
        const updateDoc = {
            $set: {
                "Shares": data["Shares"],
                "Total": data["Total"]
            },
        };
        db.collection("Transactions").updateOne(filter, updateDoc, (err, res) => {
            if (err) {
                throw (err);
            }
            callback();
        })
    }
}

const depositMoney = (db, callback, data) => {
    db.collection("Deposit").insertOne(data, (err, res) => {
        if (err) {
            console.log(err);
        }
        callback();
    })
}

const buyPower = (db, callback, data) => {
    db.collection("BuyPower").insertOne(data, (err, res) => {
        if (err) {
            console.log(err);
        }
        callback();
    })
}

const tradeHistory = (db, callback, data) => {
    db.collection("TradeHistory").insertOne(data, (err, res) => {
        if (err) {
            console.log(err)
        }
        callback();
    })
}

const getAllTradeHistory = async (db, res) => {
    const collection = db.collection("TradeHistory");
    const uniqueArr = await collection.distinct("stock");
    let data = {}
    for (let i = 0; i < uniqueArr.length; i++) {
        const list = await collection.find({ "stock": uniqueArr[i] }).toArray();
        data = { ...data, [uniqueArr[i]]: list };
    }
    res.status(200)
        .json({
            data
        });
}

const addInvesting = async (db, callback, data) => {
    const collection = db.collection("Investing");
    collection.insertOne(data, (err, result) => {
        if (err) {
            console.log(err);
        }
        callback();
    })
}

const getAllInvesting = async (db, res) => {
    const collection = db.collection("Investing");
    const day = new Date();
    const [today, time] = day.toLocaleString('en-US', { timeZone: 'America/New_York' }).split(', ')
    collection.find({"date": today}).toArray((err, result) => {
        res.status(200)
            .json(result);
    })
}

const resetEverything = (db, res) => {
    db.dropDatabase((err, result) => {
        if (err) {
          console.error(err);
          res.status(500).send('Internal server error');
          return;
        }
    
        console.log(`Database deleted: ${result}`);
        res.status(200).send('Reset everything');
      });
}

exports.insertTransaction = insertTransaction;
exports.getAllTransactions = getAllTransactions;
exports.updateExistedStock = updateExistedStock;
exports.insertStockPrice = insertStockPrice;
exports.sellTransaction = sellTransaction;
exports.depositMoney = depositMoney;
exports.buyPower = buyPower;
exports.tradeHistory = tradeHistory;
exports.getAllTradeHistory = getAllTradeHistory;
exports.addInvesting = addInvesting;
exports.getAllInvesting = getAllInvesting;
exports.resetEverything = resetEverything;