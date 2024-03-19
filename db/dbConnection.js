const { Client } = require('pg');
const mysql = require('mysql')

//Conexion a Postgresql
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'Dicom',
    host: process.env.DB_HOST || 'localhost', // Cambia esto si tu base de datos está en otro servidor
    port: process.env.DB_PORT || 5432, // Puerto por defecto de PostgreSQL
};

const dbClient = new Client(dbConfig);

// Conecta al cliente a la base de datos Dicom o configurada en env
async function conectarBaseDeDatos() {
    try {
        await dbClient.connect();
        console.log('[info] Conexión exitosa a la base de datos');
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
    }
}

const mysqlClient = mysql.createConnection({
    host: process.env.DB_MYSQL_HOST || 'localhost',
    user: process.env.DB_MYSQL_USER || 'root',
    password : process.env.DB_MYSQL_PASSWORD || '',
    database : process.env.DB_MYSQL_NAME || 'hisa'
})

async function conectarBaseDeDatosMySql(){
    try {
        mysqlClient.connect();
        console.log('[info] Conexión a base de datos MySql realizada correctamente')
    } catch (error) {
        console.log('[error] Ha ocurrido un error al conectar a base de datos MySql', error)
    }
}

module.exports = {
    dbClient,
    conectarBaseDeDatos,
    conectarBaseDeDatosMySql,
    mysqlClient
}