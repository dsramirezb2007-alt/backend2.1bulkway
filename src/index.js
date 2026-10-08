import express from 'express';
//const express = require('express'); ---->> "type": "commonjs",
const app = express();

//Definiendo 1 endpoint (rutas de entrada)
app.get('/health', (req, res) => {
    res.send('Servidor de Mi proyecto backend Funcionando')
});


//listar
app.get('/ruta', (req, res) => {
    res.json({msg:'listar todas las rutas'})
});

//registrar
app.post('/ruta', (req, res) => {
    res.json({msg:'registrar todas las rutas'})
});

//actualizar
app.patch('/ruta', (req, res) => {
    res.json({msg:'actualizar todas las rutas'})
});

//eliminar
app.delete('/ruta', (req, res) => {
    res.json({msg:'eliminar las rutas'})
});



//Iniciar el servidor
const port = 3000;

app.listen(port, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});
