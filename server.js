require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const errorHandler = require("./middleware/errorHandler");

const app = express();


// MIDDLEWARE
app.use(express.json());


// ROUTES
app.use("/api/products", require("./routes/productRoutes"));


// TEST ROUTE
app.get("/", (req, res) => {
    res.send("Inventory Management API is running!");
});


// ERROR HANDLER
app.use(errorHandler);


// DATABASE CONNECTION AND SERVER START
mongoose.connect(process.env.MONGO_URI)
    .then(() => {

        console.log("MongoDB Connected Successfully");

        app.listen(process.env.PORT || 3000, () => {
            console.log("Server running on port 3000");
        });

    })
    .catch(err => {
        console.error("MongoDB Connection Failed:", err.message);
        process.exit(1);
    });