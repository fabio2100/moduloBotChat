
const patientModel = require('../models/patientsModel')


async function getPatientData(patientId){
    const users = await patientModel.getPatientData(patientId);
    if(users.length==1){
        return users[0]
    }
    if(users.length==0){
        return false;
    }
    if(users.length>1){
        return `error`;
    }
}


module.exports = {
    getPatientData
}