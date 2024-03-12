const axios = require('axios')
// Function to send a message using the Wassenger API
//send message phone, number to enviar
// messsage: message to enviar
// media nada. 
// deive token device 
// enqueue never
async function sendMessage ({ phone, message, media, device, ...fields }) {
    const url = `${process.env.API_URL}/messages`
    const body = {
      phone,
      message,
      media,
      device,
      ...fields,
      enqueue: 'never'
    }
  
    let retries = 3
    while (retries) {
      retries -= 1
      try {
        const res = await axios.post(url, body, {
          headers: { Authorization: process.env.API_KEY }
        })
        console.log('[info] Message sent:', phone, res.data.id, res.data.status)
        return res.data
      } catch (err) {
        console.error('[error] failed to send message:', phone, message || (body.list ? body.list.description : '<no message>'), err.response ? err.response.data : err)
      }
    }
    return false
  }

  module.exports = sendMessage