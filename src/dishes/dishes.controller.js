const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res, next) {
    res.json({ data: dishes})
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

function validateString(req, res, next) {
    const {data: {name, description, image_url} = {}} = req.body
    if(!name || !description || !image_url) {
        next({status: 400, message: `Value is required.`})
    } else {
        next()
    }
}

function validatePriceIsNumber(req, res, next) {
    const {data: {price} = {}} = req.body
    if (price <= 0 || !Number.isInteger(price)) {
        next({status: 400, message: `'price' requires a valid number.`})
    } else {
        next()
    }
}

function validateDishExists(req, res, next) {
    const dishId = req.params.dishId
    const foundDish = dishes.find(dish => dish.id === dishId)
    if (foundDish) {
        res.locals.dish = foundDish
        next()
    } 
     else {
        next({status: 404, message: `Dish id not found: ${dishId}`})
    }
}

function validateDishMatch(req, res, next) {
    const {data: {id} = {}} = req.body
    if (id && res.locals.dish.id !== id) {
        next({status: 400, message: `Dish id does not match route id. Dish: ${id}, Route: ${res.locals.dish.id}`})
    } else {
        next()
    }
}

function create(req, res, next) {
    const {data: {name, description, price, image_url} ={}} = req.body
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url
    }
    dishes.push(newDish)
    res.status(201).json({data: newDish})
}

function read(req, res, next) {
    res.json({data: res.locals.dish})
}

function update(req, res, next) {
    const dish = res.locals.dish
    const {data: {id, name, description, price, image_url} = {}} = req.body

    

    dish.name = name
    dish.description = description
    dish.price = price
    dish.image_url = image_url

    res.json({data: dish})
}

module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        validateString,
        validatePriceIsNumber,
        create
    ],
    read: [validateDishExists, read],
    update: [
        validateDishExists,
        validateDishMatch,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        validateString,
        validatePriceIsNumber,
        update
    ],
    list,
}