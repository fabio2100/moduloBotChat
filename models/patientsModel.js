

const {mysqlClient} = require('../db/dbConnection');


async function getPatientData(patientId){
    const query = `SELECT * FROM pacientes WHERE patientid='${patientId}';`;
    return new Promise((resolve,reject)=>{
        mysqlClient.query(query,(err,res)=>{
            if(err){
                console.log(`Ha ocurrido un error`,{err});
                reject(err)
            }
            resolve(res)
        })
    }) 
}


module.exports = {
    getPatientData
}