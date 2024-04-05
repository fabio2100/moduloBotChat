
const {mysqlClient} = require('../db/dbConnection');


async function saveTurno(patientId,fechaYHora){
    const query = `INSERT INTO turnos(patientid,fechahora,estado) VALUES (?,?,'PENDIENTE')`;
    const values = [patientId,fechaYHora];
    return new Promise((resolve,reject)=>{
        mysqlClient.query(query,values,(err,res)=>{
            if(err){
                console.log(`[error]Ha ocurrido un error`,{err});
                reject(err)
            }
            resolve(res)
        })
    }) 
}

function getTurnosByPatientId(patientId){
    const query = `SELECT * FROM turnos WHERE patientid=? ORDER BY fechahora`;
    const values = [patientId];

    return new Promise((resolve,reject)=>{
        mysqlClient.query(query,values,(err,res)=>{
            if(err){
                console.log(`[error]Ha ocurrido un error`,{err});
                reject(err) 
            }
            resolve(res)
        })
    })

}


module.exports = {
    saveTurno,
    getTurnosByPatientId
}