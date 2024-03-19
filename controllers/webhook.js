const patientController = require('../controllers/patients');
const sendMessage = require('../helpers/sendMessage');

const {canReply} = require('../helpers/canReply');
const {mysqlClient} = require('../db/dbConnection')

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
  
    console.log('-----------------------se llama al webhook')
    console.log(Date.now())
    
    if(status.hasOwnProperty(data.chat.id) && (status[data.chat.id].date + 100000 > Date.now())){
        const textoIngresado = data.body;
        if(textoIngresado=='cancelar'){
            status[data.chat.id] = {date:Date.now(),step:`menuPrincipal`};
            return menuPrincipal();
        }
        switch(status[data.chat.id].step){
            case `menuPrincipal`:
                const patient =  await patientController.getPatientData(textoIngresado);
                if(patient){
                    status[data.chat.id] = {date:Date.now(),step:`menuTurnos`};
                    escribirMensaje(`Hola ${patient.patientsname}`);
                    escribirMensaje(`¿Qué acción deseas realizar?`,[
                        {"text":`*Mis turnos*`},
                        {"text":`*Nuevo turno*`}
                    ])
                }else{
                    status[data.chat.id] = {date:Date.now(),step:`menuPrincipal`};
                    escribirMensaje(`Paciente no encontrado`)
                }
            case `menuTurnos`:
                console.log('MENU TURNOS')
                switch(data.body.toLowerCase()){
                    case '1':
                    case 'mis turnos':
                        escribirMensaje(`ver turnos elegidos`);
                        break;
                    case '2':
                    case 'nuevo turno':
                        escribirMensaje(`nuevo turno elegido`);
                        break;
                    default: 
                        escribirMensaje(`No entiendo lo que querés decir, intenta colocar el número de la opción o la opción con palabras tal cual se menciona en el mensaje`)
                }
        }
        
    }else{
        return menuPrincipal()
    }

    function menuPrincipal(forzado=0){
        status[data.chat.id] = {date:Date.now(),step:`menuPrincipal`}
        if(forzado){
            escribirMensaje(`No se entiende el mensaje. Volviendo al menú principal`)
        }
        escribirMensaje(`Bienvenido al menú de turnos. Por favor, ingrese su id de paciente para continuar`)
    }
    
    function escribirMensaje(mensaje=null,botones=[]){
        if(mensaje==null && botones == []){
            return console.log('[warn] El texto a enviar debe contener algún mensaje y/o botones')
        }
        msjData = {
            phone: data.chat.id,
            message: mensaje,
            buttons:botones,
            device: process.env.DEVICE,
            enqueue: 'never'
        }
        sendMessage(msjData)
    }


}






module.exports = {webhookPost,sendMessage}