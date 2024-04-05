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

module.exports = {
    saveTurno
}