import { Router } from "express";

const router = Router();

// 1. Corregido: res.json (tenías res.jso)
router.get('/users', (req, res) => {
    res.json({ msg: 'Obtiene todos los usuarios' });
});

router.post('/users', (req, res) => {
    res.json({ msg: 'Registra usuario' });
});

router.put('/users/:id', (req, res) => {
    res.json({ msg: 'Actualizar todas las propiedades de un usuario' });
});

router.patch('/users/:id', (req, res) => {
    res.json({ msg: 'Actualizar una o más propiedades del usuario' });
});

router.delete('/users/:id', (req, res) => {
    res.json({ msg: 'Elimina un usuario' });
});

// 2. Se mantiene únicamente una exportación al final del archivo
export default router;