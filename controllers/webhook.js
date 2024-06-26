const patientController = require('../controllers/patients');
const turnosController = require('../controllers/turnos')
const sendMessage = require('../helpers/sendMessage');

const {canReply} = require('../helpers/canReply');

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
  
    console.log('-----------------------')
    console.log(Date.now())
    
    if(status.hasOwnProperty(data.chat.id) && (status[data.chat.id].date + 100000 > Date.now())){
        const currentUser = data.chat.id;
        const textoIngresado = data.body;
        if(textoIngresado=='cancelar'){
            status[currentUser] = {date:Date.now(),step:`menuPrincipal`,patient:null};
            return menuPrincipal();
        }
        console.log('paso=>',status[currentUser].step)
        switch(status[currentUser].step){
            case `menuPrincipal`:
                const patient =  await patientController.getPatientData(textoIngresado);
                if(patient){
                    status[currentUser] = {date:Date.now(),step:`menuTurnos`,patient:patient};
                    escribirMensaje(`Hola ${patient.patientsname}`);
                    menuTurnos()
                }else{
                    status[currentUser] = {date:Date.now(),step:`menuPrincipal`,patient:null};
                    escribirMensaje(`Paciente no encontrado`)
                }
                break;
            case `menuTurnos`:
                switch(data.body.toLowerCase()){
                    case '1':
                    case 'mis turnos':
                        const turnos = await turnosController.getTurnosByPatientId(status[currentUser].patient.patientid);
                        if(turnos){
                            let message=`*LISTADO DE SUS TURNOS* \n \n`;
                            turnos.forEach(turno => {
                                turno.fechahora.setHours(turno.fechahora.getHours() - 3);
                                message += `- ${turno.fechahora.toLocaleDateString('es-AR',options)} *${turno.estado}* \n`
                            });
                            escribirMensaje(message)
                            status[currentUser] = {date:Date.now(),step:`menuTurnos`,patient:status[currentUser].patient};
                            menuTurnos()
                        }else{
                            escribirMensaje(`Usted no posee turnos`);
                            status[currentUser] = {patient:status[currentUser].patient,date:Date.now(),step:`menuTurnos`};
                            menuTurnos() 
                        }
                        break;
                    case '2':
                    case 'nuevo turno':
                        var date = new Date();
                        const primerOpcion = new Date(date);
                        primerOpcion.setHours(date.getHours() + 1);
                        primerOpcion.setMinutes('00')
                        primerOpcion.setSeconds('00')
                        const dateDespues = new Date(date);
                        dateDespues.setHours(date.getHours() + 4)
                        dateDespues.setMinutes('00')
                        dateDespues.setSeconds('00')
                        const dateMna = new Date(date);
                        dateMna.setDate(date.getDate()+1);
                        dateMna.setMinutes('00')
                        dateMna.setSeconds('00')
                        const datePasadoMna = new Date(date);
                        datePasadoMna.setDate(date.getDate()+2);
                        datePasadoMna.setMinutes('00')
                        datePasadoMna.setSeconds('00')
                        escribirMensaje('*PRÓXIMOS TURNOS DISPONIBLES*',[
                            {"text":`${primerOpcion.toLocaleDateString('es-AR',options)}`},
                            {"text":`${dateDespues.toLocaleDateString('es-AR',options)}`},
                            {"text":`${dateMna.toLocaleDateString('es-AR',options)}`},
                            {"text":`${datePasadoMna.toLocaleDateString('es-AR',options)}`},
                        ])
                        status[currentUser] = {patient:status[currentUser].patient,date:Date.now(),step:`seleccionTurno`,turnos:[primerOpcion,dateDespues,dateMna,datePasadoMna]};
                        break;  
                    case '3':
                    case 'eliminar turno':
                        const turnosEliminar = await turnosController.getTurnosByPatientId(status[currentUser].patient.patientid);
                        console.log(turnosEliminar)
                        if(turnosEliminar){
                            let message=`*INGRESE EL NÚMERO DEL TURNO A ELIMINAR* \n \n`;
                            let arrayTurnos = [];
                            turnosEliminar.forEach(turno => {
                                turno.fechahora.setHours(turno.fechahora.getHours() - 3);
                                arrayTurnos.push({"text":turno.fechahora.toLocaleDateString('es-AR',options),turnoId:turno.turnoid});
                            })
                            escribirMensaje(message,arrayTurnos)
                            status[currentUser] = {date:Date.now(),step:`seleccionTurnoAEliminar`,patient:status[currentUser].patient,arrayTurnos};
                        }else{
                            escribirMensaje(`Usted no posee turnos`);
                            status[currentUser] = {patient:status[currentUser].patient,date:Date.now(),step:`menuTurnos`};
                            menuTurnos() 
                        }
                    break;
                    default: 
                        escribirMensaje(`No entiendo lo que querés decir, intenta colocar el número de la opción o la opción con palabras tal cual se menciona en el mensaje`);
                        break;
                    }
                break;
            case 'seleccionTurno':
                const userSelection = data.body.toLowerCase() - 1
                escribirMensaje(`¿Quieres confirmar el turno el *${status[currentUser].turnos[userSelection].toLocaleDateString('es-AR',options)}*`,[
                    {"text":"*SÍ*"},
                    {"text":"*NO*"},
                ]);
                status[currentUser] = {patient:status[currentUser].patient,date:Date.now(),step:`confirmaTurno`,turno:status[currentUser].turnos[userSelection].toISOString().slice(0,19).replace('T',' ')}
                break;
            case 'seleccionTurnoAEliminar':
                console.log(status[currentUser])
                const turnoAEliminar = data.body.toLowerCase() - 1
                escribirMensaje(`¿Estás seguro que quieres eliminar el turno el *${status[currentUser].turnos[turnoAEliminar].toLocaleDateString('es-AR',options)}*`,[
                    {"text":"*SÍ*"},
                    {"text":"*NO*"},
                ]);
            break;
            case 'confirmaTurno':
                switch (data.body.toLowerCase() - 1){
                    case 0:
                        const patientId = status[currentUser].patient.patientid;
                        const fechaYHora = status[currentUser].turno;
                        const res = await turnosController.saveTurno(patientId,fechaYHora);
                        if(res){
                            escribirMensaje(`Turno guardado correctamente`);
                        }else{
                            escribirMensaje('Ocurrió un error al tratar de guardar el turno, vuelva a intentarlo');
                        }
                        status[currentUser] = {patient:status[currentUser].patient,date:Date.now(),step:`menuTurnos`};
                        menuTurnos()
                        break;
                    case 1:
                        status[currentUser] = {patient:status[currentUser].patient,date:Date.now(),step:`menuTurnos`};
                        menuTurnos()
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

    function menuTurnos(){
        escribirMensaje(`*¿Qué acción deseas realizar?*`,[
            {"text":`Mis turnos`},
            {"text":`Nuevo turno`},
            {"text":`Eliminar turno`}
        ])
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