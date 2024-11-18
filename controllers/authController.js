const User = require('../models/authModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

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

            const profileImage = req.file ? '/paginas/login/uploads/' + req.file.filename : null;
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
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({ success: false, errors: { email: 'E-mail inválido.' } });
            }
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                req.session.userId = user.user_id;
                req.session.username = user.username;
                req.session.profileImage = user.profile_image;
                const profileImagePath = user.profile_image ? `/paginas/login/uploads/${user.profile_image}` : 'paginas/login/uploads/usuarioDefault.jpg';
                return res.json({ success: true, message: "Login bem-sucedido!", redirect: 'userLogado.html', profileImagePath, username: user.username });
            } else {
                return res.status(401).json({ success: false, errors: { password: 'Senha incorreta.' } });
            }
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            res.status(500).json({ success: false, message: "Erro ao fazer login." });
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
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: "Não autenticado." });
        }

        try {
            const userId = req.session.userId;
            const user = await User.findByEmail(email);
            const isPasswordMatch = await bcrypt.compare(senhaAtual, user.password);
            if (!isPasswordMatch) {
                return res.status(401).json({ success: false, message: "Senha atual incorreta." });
            }

            if (novaSenha && novaSenha === confirmacaoNovaSenha) {
                await User.update(userId, username, email, novaSenha, req.file ? '/paginas/login/uploads/' + req.file.filename : null);
            } else {
                await User.update(userId, username, email, null, req.file ? '/paginas/login/uploads/' + req.file.filename : null);
            }

            req.session.username = username;
            req.session.profileImage = user.profile_image;

            res.redirect('/paginas/login/userEdited.html');
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            res.status(500).json({ success: false, message: "Erro ao atualizar perfil." });
        }
    }
};

module.exports = authController;
