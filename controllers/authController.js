const User = require('../models/authModel');
const bcrypt = require('bcryptjs'); // Substituindo bcrypt por bcryptjs
const jwt = require('jsonwebtoken'); // Para trabalhar com tokens
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const SECRET_KEY = "sua_chave_secreta"; // Altere para uma chave segura e armazene em variáveis de ambiente!


const authController = {
    async register(req, res) {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: "Preencha todos os campos." });
        }
        try {
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ success: false, message: "E-mail já cadastrado." });
            }

            const profileImage = req.file ? 'uploads/' + req.file.filename : null;
            await User.create(username, email, password, profileImage);
            res.json({ success: true, message: "Usuário cadastrado com sucesso." });
        } catch (error) {
            console.error('Erro ao cadastrar usuário:', error);
            res.status(500).json({ success: false, message: "Erro ao cadastrar." });
        }
    },

    async login(req, res) {
        const { email, password } = req.body;
    
        try {
            console.log(`Tentando login com o email: ${email}`);
            const user = await User.findByEmail(email);
    
            if (!user) {
                console.log('Usuário não encontrado');
                return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
            }
    
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                console.log('Senha não corresponde');
                return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
            }
    
            // Gerar token JWT
            const token = jwt.sign(
                { userId: user.user_id, username: user.username },
                SECRET_KEY,
                { expiresIn: '15m' }
            );
    
            console.log('Token gerado:', token);
    
            const profileImagePath = user.profile_image
                ? `uploads/${user.profile_image}`
                : 'uploads/usuarioDefault.jpg';
    
            return res.json({
                success: true,
                message: 'Login bem-sucedido!',
                token,
                profileImagePath,
                username: user.username
            });
        } catch (error) {
            console.error('Erro interno no servidor:', error); // Log detalhado
            return res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
        }
    },
    
    async forgotPassword(req, res) {
        const { email } = req.body;
        try {
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(400).send('E-mail não encontrado');
            }

            const token = crypto.randomBytes(20).toString('hex');
            await User.setResetToken(email, token);

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'styleinfocuscontact@gmail.com',
                    pass: 'eihb vqrf byzw qzyt',
                },
            });

            const resetLink = `http://localhost:3000/reset-password?token=${token}`;
            const mailOptions = {
                to: email,
                subject: 'Recuperação de Senha',
                text: `Você solicitou a recuperação de senha. Clique no link abaixo para redefinir sua senha: \n\n${resetLink}`,
            };

            await transporter.sendMail(mailOptions);
            res.send('E-mail enviado com instruções para recuperação de senha');
        } catch (error) {
            console.error(error);
            res.status(500).send('Erro ao processar a solicitação');
        }
    },

    async resetPassword(req, res) {
        const { token, newPassword } = req.body;
        try {
            const user = await User.findByToken(token);
            if (!user) {
                return res.status(400).send('Token inválido ou expirado');
            }

            await User.resetPassword(token, newPassword);
            res.send('Senha alterada com sucesso');
        } catch (error) {
            console.error(error);
            res.status(500).send('Erro ao processar a solicitação');
        }
    },

    async update(req, res) {
        const { username, email, senhaAtual, novaSenha, confirmacaoNovaSenha } = req.body;
    
        const token = req.headers.authorization?.split(' ')[1];
    
        if (!token) {
            return res.status(401).json({ success: false, message: "Não autenticado." });
        }
    
        try {
            // Verificar o token JWT
            const decoded = jwt.verify(token, SECRET_KEY);
            const userId = decoded.userId;
    
            const user = await User.findByEmail(email);
            const isPasswordMatch = await bcrypt.compare(senhaAtual, user.password);
    
            if (!isPasswordMatch) {
                return res.status(401).json({ success: false, message: "Senha atual incorreta." });
            }
    
            let filePath = null;
            if (req.file) {
                filePath = 'uploads/' + req.file.filename;
            }
    
            if (novaSenha && novaSenha === confirmacaoNovaSenha) {
                await User.update(userId, username, email, novaSenha, filePath);
            } else {
                await User.update(userId, username, email, null, filePath);
            }
    
            res.json({ success: true, message: "Perfil atualizado com sucesso." });
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            res.status(500).json({ success: false, message: "Erro ao atualizar perfil." });
        }
    }
};
module.exports = authController;
