const patientController = require('../controllers/patients');
const sendMessage = require('../helpers/sendMessage');

const {canReply} = require('../helpers/canReply');

const status = {};

function webhookPost(req,res){
    const now = new Date();
    console.log(now.toISOString())
    const {body} = req;
    procesarMensaje(body);
    return res.status(200).json({msg:'from controller web hook'})
}

async function procesarMensaje({data,device}){
    if(!canReply({data,device})){
        return console.log('[info] Skip message due to chat already assigned or not eligible to reply:', data.fromNumber, data.date, data.body)
    }
    //Responder el mensaje. Se usa promesa porque puede responderse ahora o en un futuro
    //para escribir el mensaje a enviar necesitamos dos cosas, el lugar donde se encuentra el usuario y la opcion seleccionada=> luego con eso devolver la informacion
    async function escribirMensajeAEnviar(status){
        if(status.hasOwnProperty(data.chat.id) && (status[data.chat.id].date + 10000 > Date.now())){
            switch (status[data.chat.id].step){
                case `1-menu`:
                    console.log(data.body.toLowerCase())
                    switch (data.body.toLowerCase()){
                        case '1':
                        case 'estudios':
                            status[data.chat.id] = {date: Date.now(),step:`2-estudios`};
                            return escribirMensajeAEnviar(status)
                        case '2':
                        case 'turnos':
                            status[data.chat.id] = {date: Date.now(),step:`2-turnos`};
                            return escribirMensajeAEnviar(status)
                        case '3':
                        case 'opciones':
                            status[data.chat.id] = {date: Date.now(),step:`2-opciones`};
                            return escribirMensajeAEnviar(status)
                        default:
                            status[data.chat.id] = {date: Date.now(),step:`1-menu`};
                            return {mensaje:`No puedo entender la opción seleccionada, vuelve a intentarlo`}
                    }
                case `2-turnos`:
                    console.log('turnos seleccionado');
                    console.log(data.body.toLowerCase())
                    return {mensaje: `Menu de turnos`}
                default:
                    status[data.chat.id] = {date: Date.now(),step:`1-menu`};
                    return {mensaje:`No puedo entender la opción seleccionada, vuelve a intentarlo`}

            }
            
        }else{
            status[data.chat.id] = {date: Date.now(),step:`1-menu`};
            return {mensaje:`Menu principal`,botones:[{
                "id": "id1",
                "text": "Estudios"
              },
              {
                "id": "id2",
                "text": "Turnos"
              },
              {
                "id": "id3",
                "text": "Opciones"
              }]}
        }
    }
    
    
    
    
    let {mensaje,botones} = await escribirMensajeAEnviar(status)
    msjData = {
        phone: data.chat.id,
        message: mensaje,
        buttons:botones,
        device: process.env.DEVICE,
        enqueue: 'never'
    }
    sendMessage(msjData)
}






module.exports = {webhookPost,sendMessage}