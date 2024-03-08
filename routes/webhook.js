const express = require('express')
const webhookController = require('../controllers/webhook')

const api = express.Router();

api.post('*',webhookController.webhookPost)


module.exports = api