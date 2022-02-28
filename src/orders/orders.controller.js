const { utimesSync } = require("fs");
const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res, next) {
    res.json({data: orders})
}

function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({ status: 400, message: `Must include a ${propertyName}` });
    };
  }

function validateDishes(req, res, next) {
    const {data: {dishes} = {}} = req.body
    if (dishes.length === 0 ) {
        next({status: 400, message: "There must be at least one dish within the order."})
    } else if (!Array.isArray(dishes)) {
        next({status: 400, message: "'dishes' must be an array."})
    }
        for (let i = 0; i < dishes.length; i ++) {
            let dish = dishes[i]
            if(!dish.quantity || dish.quantity <= 0 || !Number.isInteger(dish.quantity)) {
                next({status: 400, message: `Dish ${i} must have a quantity that is an integer greater than 0`})
            }
        }
    next()
}

function validateStatusDelivery(req, res, next) {
    const {data: {status}} = req.body
    if(status === "pending" || status === "preparing" || status === "out-for-deilvery") {
        next()
    }
    next({status: 400, message: `Status '${status}' is invalid. 'status' must be 'pending', 'preparing', or 'out-for-delivery' to be updated.`})
}

function validateOrderStatusForDeletion(req, res, next) {
    const order = res.locals.order
    if(order.status !== "pending") {
        next({status: 400, message: `'status' must be 'pending' in order to remove.`})
    }
    next()
}

function orderExists(req, res, next) {
    const orderId = req.params.orderId
    const foundOrder = orders.find(order => order.id === orderId)
    if (foundOrder) {
        res.locals.order = foundOrder
        next()
    } else {
        next({status: 404, message: `Order id not found: ${req.params.orderId}`})
    }
}

function orderMatches(req, res, next) {
    const {data: {id} = {}} = req.body
    if (id && id !== res.locals.order.id) {
        next({status: 400, message: `Order id does not match route id. Order: ${id} Route: ${res.locals.order.id}`})
    }
    next()
}

function create(req, res, next) {
    const {data: {deliverTo, mobileNumber, dishes}} = req.body
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        dishes
    }
    orders.push(newOrder)
    res.status(201).json({data: newOrder})
}

function read(req, res, next) {
    res.json({data: res.locals.order})
}

function update(req, res, next) {
    const order = res.locals.order
    const {data: {deliverTo, mobileNumber, dishes} ={}} = req.body

    order.deliverTo = deliverTo
    order.mobileNumber = mobileNumber
    order.dishes = dishes

    res.json({data: order})
}

function destroy(req, res, next) {
    const orderId = req.params.orderId
    const foundIndex = orders.findIndex(order => order.id === orderId)

    if (foundIndex > -1) {
        orders.splice(foundIndex, 1)
    } 
    res.sendStatus(204)
}

module.exports = {
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        validateDishes,
        create
    ],
    read: [
        orderExists,
        read
    ],
    update: [
        orderExists,
        orderMatches,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("status"),
        bodyDataHas("dishes"),
        validateStatusDelivery,
        validateDishes,
        update
    ],
    delete: [orderExists, validateOrderStatusForDeletion, destroy],
    list,
}