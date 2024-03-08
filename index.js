require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios');
const {dbClient,conectarBaseDeDatos} = require('./db/dbConnection');
const webhookRoutes = require('./routes/webhook')

const API_URL = process.env.API_URL || 'https://api.wassenger.com/v1'

const app = express();
app.use(bodyParser.json());

//Rutas
app.post('/webhook', webhookRoutes)

// Function to register a Ngrok tunnel webhook for the chatbot
// Only used in local development mode
async function registerWebhook (tunnel, device) {
    const webhookUrl = `${tunnel}/webhook`
  
    const url = `${API_URL}/webhooks`
    const { data: webhooks } = await axios.get(url, {
      headers: { Authorization: process.env.API_KEY }
    })
  
    const findWebhook = webhook => {
      return (
        webhook.url === webhookUrl &&
        webhook.device === device.id &&
        webhook.status === 'active' &&
        webhook.events.includes('message:in:new')
      )
    }
  
    // If webhook already exists, return it
    const existing = webhooks.find(findWebhook)
    if (existing) {
      return existing
    }
  
    for (const webhook of webhooks) {
      // Delete previous ngrok webhooks
      if (webhook.url.includes('ngrok-free.app') || webhook.url.startsWith(tunnel)) {
        const url = `${API_URL}/webhooks/${webhook.id}`
        await axios.delete(url, { headers: { Authorization: process.env.API_KEY } })
      }
    }
  
    await new Promise(resolve => setTimeout(resolve, 500))
    const data = {
      url: webhookUrl,
      name: 'Chatbot',
      events: ['message:in:new'],
      device: device.id
    }
  
    const { data: webhook } = await axios.post(url, data, {
      headers: { Authorization: process.env.API_KEY }
    })
  
    return webhook
  }

  // Function to create a Ngrok tunnel and register the webhook dynamically
async function createTunnel () {
    let retries = 3
  
    while (retries) {
      retries -= 1
      try {
        const tunnel = await ngrok.connect({
          addr: process.env.PORT,
          authtoken: process.env.NGROK_TOKEN
        })
        console.log(`Ngrok tunnel created: ${tunnel}`)
        return tunnel
      } catch (err) {
        console.error('[error] Failed to create Ngrok tunnel:', err.message)
        await ngrok.kill()
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  
    throw new Error('Failed to create Ngrok tunnel')
}

// Development server using nodemon to restart the bot on file changes
async function devServer () {
    const tunnel = await createTunnel()
  
    nodemon({
      script: 'index.js',
      ext: 'js',
      watch: ['*.js', 'src/**/*.js'],
      exec: `WEBHOOK_URL=${tunnel} DEV=false npm run start`,
    }).on('restart', () => {
      console.log('[info] Restarting bot after changes...')
    }).on('quit', () => {
      console.log('[info] Closing bot...')
      ngrok.kill().then(() => process.exit(0))
    })
}

// Find an active WhatsApp device connected to the Wassenger API
async function loadDevice () {
    const url = `${API_URL}/devices`
    const { data } = await axios.get(url, {
      headers: { Authorization: process.env.API_KEY }
    })
    if (process.env.DEVICE && !process.env.DEVICE.includes(' ')) {
      if (/^[a-f0-9]{24}$/i.test(process.env.DEVICE) === false) {
        return exit('Invalid WhatsApp device ID: must be 24 characers hexadecimal value. Get the device ID here: https://app.wassenger.com/number')
      }
      return data.find(device => device.id === process.env.DEVICE)
    }
    return data.find(device => device.status === 'operative')
  }

function exit (msg, ...args) {
    console.error('[error]', msg, ...args)
    process.exit(1)
}

// Initialize chatbot server
async function main () {
    // API key must be provided
    conectarBaseDeDatos()
    if (!process.env.API_KEY || process.env.API_KEY.length < 60) {
      return exit('Please sign up in Wassenger and obtain your API key here:\nhttps://app.wassenger.com/apikeys')
    }
  
    // Create dev mode server with Ngrok tunnel and nodemon
    if (process.env.ENV_NODE == 'production') {
      return devServer()
    }
  
    // Find a WhatsApp number connected to the Wassenger API
    const device = await loadDevice()
    if (!device) {
      return exit('No active WhatsApp numbers in your account. Please connect a WhatsApp number in your Wassenger account:\nhttps://app.wassenger.com/create')
    }
    if (device.session.status !== 'online') {
      return exit(`WhatsApp number (${device.alias}) is not online. Please make sure the WhatsApp number in your Wassenger account is properly connected:\nhttps://app.wassenger.com/${device.id}/scan`)
    }
    if (device.billing.subscription.product !== 'io') {
      return exit(`WhatsApp number plan (${device.alias}) does not support inbound messages. Please upgrade the plan here:\nhttps://app.wassenger.com/${device.id}/plan?product=io`)
    }
  
    app.device = device
    console.log('[info] Using WhatsApp connected number:', device.phone, device.alias, `(ID = ${device.id})`)
  
    // Start server
    await app.listen(process.env.port, () => {
      console.log(`Server listening on port ${process.env.port}`)
    })
  
    if (process.env.ENV_NODE) {
      console.log('[info] Validating webhook endpoint...')
      if (!process.env.WEBHOOK_URL) {
        return exit('Missing required environment variable: WEBHOOK_URL must be present in production mode')
      }
      const webhook = await registerWebhook(process.env.WEBHOOK_URL, device)
      if (!webhook) {
        return exit(`Missing webhook active endpoint in production mode: please create a webhook endpoint that points to the chatbot server:\nhttps://app.wassenger.com/${device.id}/webhooks`)
      }
      console.log('[info] Using webhook endpoint in production mode:', webhook.url)
    } else {
      console.log('[info] Registering webhook tunnel...')
      const tunnel = process.env.WEBHOOK_URL || await createTunnel()
      const webhook = await registerWebhook(tunnel, device)
      if (!webhook) {
        console.error('Failed to connect webhook. Please try again.')
        await ngrok.kill()
        return process.exit(1)
      }
    }
  
    console.log('[info] Chatbot server ready and waiting for messages!')
  }
  
  main().catch(err => {
    exit('Failed to start chatbot server:', err)
})

