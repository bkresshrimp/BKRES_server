const swaggerAutogen = require('swagger-autogen')();
const path = require('path');
const outputFile = path.resolve(__dirname, 'swagger_output.json');
const endpointsFiles = [path.resolve(__dirname, 'server.js')]; 

const doc = {
  info: {
    title: 'BKRES API',
    description: ''
  },
  host: 'localhost:5000',
  schemes: ['http'],
  tags: [
    {
      name: 'User',
      description: 'Operations about users'
    },
    {
      name: 'Gateway',
      description: 'Operations about gateways'
    },
    {
      name: 'Device',
      description: 'Operations about devices'
    },
    {
      name: 'Sensor',
      description: 'Operations about sensors'
    },
    {
      name: 'Data',
      description: 'Operations about datas'
    },
  ]
};

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('Swagger documentation has been generated');
});
