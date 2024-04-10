*** Instalación ***

* Copiar y pegar el archivo *.env.example* y cambiarle el nombre al nuevo archivo por *.env*
* Copiar todas las variables con la información personal. 
* *PORT* puerto donde se escuchará, *8080* por defecto 
* *API_URL* Api de wassenger
* *DEVICE* Dispositivo a usar conectado en wassenger. Se consigue ingresando en wassenger, luego a algún dispositivo y buscando el *identificador* que es un número de 24 dígitos
* *API_KEY* Es el token de la cuenta de wassenger. Se consigue dentro de la plataforma, por ejemplo copiándolo de algún ejemplo de cómo usar la *api*
* *NODE_ENV* Es el tipo de entorno sobre el que se trabajará. En caso de un ambiente de producción, cambiar a produccion
* *WEBHOOK_URL* Es la *url* que recibirá los llamados de los eventos de wassenger. Colocar la *url* a usar, en caso de un entorno local, configurarla usando algún puente, como por ejempo *ngrok*
* *NGROK_TOKEN* Token de ngrok, si se setea un valor en el anterior no hace falta colocar nada. 