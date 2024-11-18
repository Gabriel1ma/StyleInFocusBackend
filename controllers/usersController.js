const usersModel = require('../models/usersmodel');


const getUsers = (req, res) => {
    usersModel.getAllUsers()
        .then(results => res.json(results))
        .catch(err => {
            console.error('Erro ao buscar usuários:', err);
            res.status(500).json({ message: 'Erro ao buscar usuários' });
        });
};


module.exports = {
    getUsers
};
