const express = require("express");
const router = express.Router();

const Product = require("../models/Product");

// 1. CREATE PRODUCT
router.post("/", async (req, res, next) => {
    try {
        const product = await Product.create(req.body);

        res.status(201).json(product);

    } catch (err) {
        next(err);
    }
});


// 2. LOW STOCK REPORT
router.get("/reports/low-stock", async (req, res, next) => {
    try {
        const products = await Product.find({
            $expr: {
                $lte: ["$quantity", "$lowStockThreshold"]
            }
        });

        res.json(products);

    } catch (err) {
        next(err);
    }
});


// 3. CATEGORY-WISE INVENTORY SUMMARY
router.get("/reports/category", async (req, res, next) => {
    try {
        const report = await Product.aggregate([
            {
                $group: {
                    _id: "$category",

                    totalProducts: {
                        $sum: 1
                    },

                    totalStock: {
                        $sum: "$quantity"
                    },

                    totalValue: {
                        $sum: {
                            $multiply: ["$price", "$quantity"]
                        }
                    }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json(report);

    } catch (err) {
        next(err);
    }
});


// 4. GET ALL PRODUCTS (FILTER, SORT, PAGINATION)
router.get("/", async (req, res, next) => {
    try {
        const {
            category,
            search,
            minPrice,
            maxPrice,
            sort = "name",
            page = 1,
            limit = 10
        } = req.query;

        const currentPage = Math.max(1, Number(page) || 1);
        const perPage = Math.min(100, Math.max(1, Number(limit) || 10));

        const filter = {};

        if (category) {
            filter.category = category;
        }

        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};

            if (minPrice !== undefined) {
                filter.price.$gte = Number(minPrice);
            }

            if (maxPrice !== undefined) {
                filter.price.$lte = Number(maxPrice);
            }
        }

        const allowedSort = ["name", "price", "quantity", "createdAt"];

        const sortField = sort.startsWith("-") ? sort.slice(1) : sort;

        if (!allowedSort.includes(sortField)) {
            return res.status(400).json({
                message: "Invalid sort field"
            });
        }

        const total = await Product.countDocuments(filter);

        const products = await Product.find(filter)
            .sort(sort)
            .skip((currentPage - 1) * perPage)
            .limit(perPage);

        res.json({
            total,
            page: currentPage,
            totalPages: Math.ceil(total / perPage),
            products
        });

    } catch (err) {
        next(err);
    }
});


// 5. GET SINGLE PRODUCT
router.get("/:id", async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json(product);

    } catch (err) {
        next(err);
    }
});


// 6. UPDATE PRODUCT
router.put("/:id", async (req, res, next) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json(product);

    } catch (err) {
        next(err);
    }
});


// 7. DELETE PRODUCT
router.delete("/:id", async (req, res, next) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            message: "Product deleted successfully"
        });

    } catch (err) {
        next(err);
    }
});


// 8. RESTOCK PRODUCT
router.patch("/:id/restock", async (req, res, next) => {
    try {
        const quantity = req.body.quantity;

        if (!Number.isSafeInteger(quantity) || quantity <= 0) {
            return res.status(400).json({
                message: "Quantity must be a positive integer"
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                $inc: { quantity: quantity }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json(product);

    } catch (err) {
        next(err);
    }
});


// 9. SELL PRODUCT
router.patch("/:id/sell", async (req, res, next) => {
    try {
        const quantity = req.body.quantity;

        if (!Number.isSafeInteger(quantity) || quantity <= 0) {
            return res.status(400).json({
                message: "Quantity must be a positive integer"
            });
        }

        const product = await Product.findOneAndUpdate(
            {
                _id: req.params.id,
                quantity: { $gte: quantity }
            },
            {
                $inc: { quantity: -quantity }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!product) {
            return res.status(400).json({
                message: "Product not found or insufficient stock"
            });
        }

        res.json(product);

    } catch (err) {
        next(err);
    }
});


module.exports = router;