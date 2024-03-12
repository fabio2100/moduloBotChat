const patientController = require('../controllers/patients');
const sendMessage = require('../helpers/sendMessage');
const {espanol} = require('../helpers/dictionary')

const pg = require('pg');
const axios = require('axios')
const patientController = require('../controllers/patients');
const {canReply} = require('../helpers/canReply');

const status = {};

function webhookPost(req,res){
    const {body} = req;
    procesarMensaje(body);
    return res.status(200).json({msg:'from controller web hook'})
}

function procesarMensaje({data,device}){
    if(process.env.FILTER_MESSAGES == 1 && !canReply({data,device})){
        return console.log('[info] Skip message due to chat already assigned or not eligible to reply:', data.fromNumber, data.date, data.body)
    }
    function escribirMensajeAEnviar(status){
        if(status.hasOwnProperty(data.chat.id)){
            if(Date.now() - status[data.chat.id].date > 60000){
                return `Menu`
            }
            else if(Date.now() - status[data.chat.id].date > 30000){
                return `Pasó mucho tiempo desde que te fuiste. Por favor ingresá de vuelta tu patientid para continuar`
            }else{
                const res  = patientController.getPatientData(data.body);              
                return res
            }
        }else{
            return `Menu`;
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






module.exports = {webhookPost,sendMessage}