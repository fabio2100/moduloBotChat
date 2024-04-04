const patientController = require('../controllers/patients');
const sendMessage = require('../helpers/sendMessage');

const {canReply} = require('../helpers/canReply');
const {mysqlClient} = require('../db/dbConnection')

const status = {};
const options = { weekday: 'short', month: 'numeric', day: 'numeric',hour:'2-digit',minute: '2-digit' };
                        

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
        console.log('paso=>',status[data.chat.id].step)
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
                break;
            case `menuTurnos`:
                console.log('MENU TURNOS')
                switch(data.body.toLowerCase()){
                    case '1':
                    case 'mis turnos':
                        escribirMensaje(`ver turnos elegidos`);
                        break;
                    case '2':
                    case 'nuevo turno':
                        var date = new Date();
                        const primerOpcion = new Date(date);
                        primerOpcion.setHours(date.getHours() + 1);
                        primerOpcion.setMinutes('00')
                        const dateDespues = new Date(date);
                        dateDespues.setHours(date.getHours() + 4)
                        dateDespues.setMinutes('00')
                        const dateMna = new Date(date);
                        dateMna.setDate(date.getDate()+1);
                        dateMna.setMinutes('00')
                        const datePasadoMna = new Date(date);
                        datePasadoMna.setDate(date.getDate()+2);
                        datePasadoMna.setMinutes('00')
                        escribirMensaje('*PRÓXIMOS TURNOS DISPONIBLES*',[
                            {"text":`${primerOpcion.toLocaleDateString('es-AR',options)}`,"id":"1"},
                            {"text":`${dateDespues.toLocaleDateString('es-AR',options)}`,"id":"2"},
                            {"text":`${dateMna.toLocaleDateString('es-AR',options)}`,"id":"3"},
                            {"text":`${datePasadoMna.toLocaleDateString('es-AR',options)}`,"id":"4"},
                        ])
                        status[data.chat.id] = {date:Date.now(),step:`seleccionTurno`,turnos:[primerOpcion,dateDespues,dateMna,datePasadoMna]};
                        break;    
                    default: 
                        escribirMensaje(`No entiendo lo que querés decir, intenta colocar el número de la opción o la opción con palabras tal cual se menciona en el mensaje`);
                        console.log('ingresa a default');
                        break;
                    }
                break;
            case 'seleccionTurno':
                const userSelection = data.body.toLowerCase() - 1
                console.log('SELECCION TURNOS');
                console.log(status[data.chat.id].turnos)
                console.log(status[data.chat.id].turnos[userSelection])
                escribirMensaje(`¿Quieres confirmar el turno el *${status[data.chat.id].turnos[userSelection].toLocaleDateString('es-AR',options)}*`,[
                    {"text":"*SÍ*"},
                    {"text":"*NO*"},
                ]);
                status[data.chat.id] = {date:Date.now(),step:`confirmaTurno`}
                break;
            case 'confirmaTurno':
                switch (data.body.toLowerCase() - 1){
                    case 0:
                        
                        break;
                    case 1:
                        status[data.chat.id] = {date:Date.now(),step:`menuTurnos`};
                        escribirMensaje(`¿Qué acción deseas realizar?`,[
                            {"text":`*Mis turnos*`},
                            {"text":`*Nuevo turno*`}
                        ])
                        break; 
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