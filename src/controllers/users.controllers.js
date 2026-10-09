const getUsers = (req, res) => {
    res.json({ msg: 'Obtiene todos los usuarios' });
};

const registrarUsers = (req, res) => {
    res.json({ msg: 'Registra  todos los usuarios' });
};
const actualizarUsers = (req, res) => {
    res.json({ msg: 'actualiza  todos los usuarios' });
};
const PropiedadesUsers  = (req, res) => {
    res.json({ msg: 'actualizar y cambiar propiedades del usuario' });
};
const eliminarUsers = (req, res) => {
    res.json({ msg: 'elimina un usuario' });
};
export{
    registrarUsers,
    getUsers,
    actualizarUsers ,
    PropiedadesUsers,
    eliminarUsers


}

