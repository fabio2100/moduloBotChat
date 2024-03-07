const { Client } = require('pg');


const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'Dicom',
    host: process.env.DB_HOST || 'localhost', // Cambia esto si tu base de datos está en otro servidor
    port: process.env.DB_PORT || 5432, // Puerto por defecto de PostgreSQL
};

const dbClient = new Client(dbConfig);

// Conecta al cliente a la base de datos
async function conectarBaseDeDatos() {
    try {
        await dbClient.connect();
        console.log('Conexión exitosa a la base de datos');
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
    }
}

module.exports = {
    dbClient,
    conectarBaseDeDatos
}