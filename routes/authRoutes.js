const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../frontend/paginas/login/uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];  // "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: 'Token não fornecido.' });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido ou expirado.' });
        }
        req.user = user;  // Armazenando a informação do usuário decodificada
        next();
    });
};

// Rota de verificação de sessão
router.get('/check-session', authenticateToken, (req, res) => {
    return res.json({
        authenticated: true,
        user: {
            username: req.user.username || 'Usuário Desconhecido',
            profileImage: req.user.profileImage || '/uploads/usuarioDefault.jpg'
        }
    });
});

// Rotas
router.post('/register', upload.single('profile_image'), authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/update', upload.single('profile_image'), authController.update);

// Rota de API para pegar dados do usuário
router.get('/api/user', authenticateToken, (req, res) => {
    pool.query('SELECT username, email, profile_image FROM users WHERE user_id = $1', [req.user.userId], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Erro ao buscar dados do usuário" });
        }

        if (results.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Usuário não encontrado" });
        }

        const user = results.rows[0];
        res.json({
            success: true,
            username: user.username,
            email: user.email,
            profile_image: user.profile_image
        });
    });
});


module.exports = router;
