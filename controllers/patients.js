
const {dbClient} = require('../db/dbConnection')

async function getPatientData(patientId){
    const query = `SELECT * FROM tb_pacientes WHERE patientid='${patientId}';`;
    dbClient.query(query,(err,res)=>{
        if(err){
            console.log({err})
        }
        return res
    })
}


module.exports = {
    getPatientData
}