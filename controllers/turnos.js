const turnosModel = require('../models/turnoModel')


async function saveTurno(patientId,fechaYHora){
    const res = await turnosModel.saveTurno(patientId,fechaYHora)
    console.log({res})
    if(res.insertId){
        return true;
    }else{
        return false;
    }
}

async function getTurnosByPatientId(patientId){
    const turnos =  await turnosModel.getTurnosByPatientId(patientId);
    if(turnos.length == 0){
        return false
    }
    return turnos;
}

module.exports = {
    saveTurno,
    getTurnosByPatientId
}