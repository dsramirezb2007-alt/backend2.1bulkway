import express from 'express';
//const express = require('express'); ---->> "type": "commonjs",
const app = express();

const port = 3000;

app.listen(port, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});
