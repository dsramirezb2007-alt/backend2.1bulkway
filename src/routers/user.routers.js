import { Router } from 'express';
import { 
    actualizarUsers,
 eliminarUsers, 
    getUsers, 
PropiedadesUsers, registrarUsers } from "../controllers/users.controllers.js";

const router = Router();


router.get('/', getUsers);
router.post('/', registrarUsers);
router.put('/', actualizarUsers);
router.patch('/', PropiedadesUsers);

router.delete('/', eliminarUsers);

export default router;