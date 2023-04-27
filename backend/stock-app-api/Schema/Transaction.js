const mongoose = require('mongoose')
const { Schema } = mongoose;

const TransactionSchema = new Schema({
    stock: String,
    shares: Number,
    price: Number,
    total: Number
})

module.exports = mongoose.model('Transaction', TransactionSchema, "Transactions")