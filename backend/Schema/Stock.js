import mongoose from 'mongoose';
const { Schema } = mongoose;

const StockSchema = new Schema({
    stock: String,
    time: Date.now,
    fields: {
        price: Number,
        growth: String
    }
})

module.exports = mongoose.model('Stock', StockSchema)