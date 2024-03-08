const pg = require('pg');
const axios = require('axios')
const patientController = require('../controllers/patients')

const status = {};

function webhookPost(req,res){
    const {body} = req;
    procesarMensaje(body);
    return res.status(200).json({msg:'from controller web hook'})
}

function procesarMensaje({data,device}){
    console.log(data.body)
    function escribirMensajeAEnviar(status){
        if(status.hasOwnProperty(data.chat.id)){
            if(Date.now() - status[data.chat.id].date > 60000){
                return `Bienvenido al bot, por favor ingrese su patientid para continuar`
            }
            else if(Date.now() - status[data.chat.id].date > 30000){
                return `Pasó mucho tiempo desde que te fuiste. Por favor ingresá de vuelta tu patientid para continuar`
            }else{
                patientController.getPatientData(data.body)
                return `Tu información será procesada`
            }
        }else{
            return `Bienvenido al bot, por favor ingrese su patientid para continuar`;
        }
    }

    const mensaje = escribirMensajeAEnviar(status)
    
    msjData = {
        phone: data.chat.id,
        message: mensaje,
        device: process.env.DEVICE,
        enqueue: 'never'
    }
    status[data.chat.id] = {date: Date.now()};
    sendMessage(msjData)
}


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
  
    console.log({body})
  
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



module.exports = {webhookPost}