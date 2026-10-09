import express from 'express';
import useRouter from './routers/user.routers.js'; 

const app = express();
app.use(express.json());

// Definiendo 1 endpoint (ruta de entrada)
app.get('/health', (req, res) => {
    res.json({ msg: 'Servidor de SenaStore Funcionando!' });
});

// Obtener todos usuarios
app.get('/users', (req, res) => {
    res.json({ msg: 'Listar todos los usuarios' });
});

// Crear un usuario
app.post('/users', (req, res) => {
    res.json({ msg: 'Registra usuario' });
});

// Actualizar totalmente
app.put('/users', (req, res) => {
    res.json({ msg: 'Actualizar todos las propiedades de un usuario' });
});

// Actualizar parcialmente
app.patch('/users', (req, res) => {
    res.json({ msg: 'Actualizar una o mas propiedades del usuario' });
});

// Eliminar un usuario
app.delete('/users', (req, res) => {
    res.json({ msg: 'Elimina un usuario' });
});

app.use("/api/Users", useRouter); 

// Iniciar el servidor
const port = 3000;
app.listen(port, () => {
    console.log("Servidor corriendo en http://localhost:${port}");
});