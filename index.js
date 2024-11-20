const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const path = require('path');
const camisasRoutes = require('./routes/camisasRoutes');
const usersRoutes = require('./routes/usersRoutes');
const freteRoutes = require('./routes/freteRoutes');
const comentarioRouter = require('./routes/comentarioRouter');

const app = express();
const SECRET_KEY = 'sua-chave-secreta'; 

app.use(bodyParser.json());
app.use(cors());

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token não fornecido.' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Token inválido ou expirado.' });
        }
        req.user = user; // Adiciona o usuário ao request
        next();
    });
};

// Configuração de arquivos estáticos
app.use(express.static(path.join(__dirname, 'frontend')));

// Rotas
app.use('/auth', authRoutes);
app.use('/camisas', camisasRoutes);
app.use('/users', usersRoutes);
app.use('/frete', freteRoutes);
app.use('/api/roupas', comentarioRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Protegendo uma rota
app.get('/users/me', authenticateToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

// Rota padrão
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// Servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
