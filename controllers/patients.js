
const {dbClient} = require('../db/dbConnection')

function getPatientData(patientId){
    const query = `SELECT * FROM tb_pacientes WHERE patientid='${patientId}';`;
    dbClient.query(query,(err,res)=>{
        if(err){
            console.log({err})
        }
        if(res){
            console.log({res})
        }
    })
}


module.exports = {
    getPatientData
}