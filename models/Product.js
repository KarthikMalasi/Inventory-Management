const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        default: ""
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    category: {
        type: String,
        required: true
    },

    quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },

    sku: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    lowStockThreshold: {
        type: Number,
        default: 5,
        min: 0
    }

}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);