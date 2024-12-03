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
                { expiresIn: '1h' }
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

    async logout(req, res) {
        try {
            // Invalida o token no frontend. No backend, apenas retorna sucesso.
            res.json({ success: true, message: 'Logout bem-sucedido.' });
        } catch (error) {
            console.error('Erro no logout:', error);
            res.status(500).json({ success: false, message: 'Erro ao realizar logout.' });
        }
    },
    
    async forgotPassword(req, res) {
        const { email } = req.body;

        try {
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(404).json({ success: false, message: 'E-mail não registrado.' });
            }

            // Geração do token JWT
            const token2 = jwt.sign(
                { userId: user.user_id, email: user.email },
                SECRET_KEY,
                { expiresIn: '1h' } // Token válido por 1 hora
            );

            const resetLink = `http://127.0.0.1:5501/frontend/paginas/login/reset-password.html?token=${token2}`;

            // Configuração e envio do e-mail
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'styleinfocuscontact@gmail.com',
                    pass: 'eihb vqrf byzw qzyt', // Substituir por variável de ambiente!
                },
            });

            const mailOptions = {
                to: email,
                subject: 'Redefinição de Senha - Style in Focus',
                html: `
                    <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                        <div style="text-align: center; padding: 20px 0; background-color: #007BFF; border-radius: 10px 10px 0 0;">
                            <h1 style="color: #fff; font-size: 24px; margin: 0;">Style in Focus</h1>
                        </div>
                        <div style="padding: 20px; background-color: #fff; border-radius: 0 0 10px 10px;">
                            <h2 style="color: #333; font-size: 20px;">Olá, ${user.username || 'Usuário'}!</h2>
                            <p style="color: #555; font-size: 16px;">
                                Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:
                            </p>
                            <div style="text-align: center; margin: 20px 0;">
                                <a href="${resetLink}" 
                                   style="display: inline-block; background-color: #007BFF; color: #fff; font-size: 16px; padding: 12px 20px; text-decoration: none; border-radius: 5px;">
                                   Redefinir Senha
                                </a>
                            </div>
                            <p style="color: #555; font-size: 14px;">
                                Se você não fez essa solicitação, ignore este e-mail.
                            </p>
                            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
                                Style in Focus - Personalize seu estilo com autenticidade.
                            </p>
                        </div>
                    </div>
                `
            };
            

            await transporter.sendMail(mailOptions);

            res.json({ success: true, message: 'E-mail enviado com instruções para recuperação de senha.' });
        } catch (error) {
            console.error('Erro no forgotPassword:', error);
            res.status(500).json({ success: false, message: 'Erro ao processar a solicitação.' });
        }
    },

    async resetPassword(req, res) {
        const token2 = req.headers['authorization']?.split(' ')[1];
    
        if (!token2) {
            return res.status(400).json({ success: false, message: 'Token não fornecido.' });
        }
    
        try {
            // Simula um delay de 2 segundos (2000 ms)
            await new Promise(resolve => setTimeout(resolve, 1000));
    
            // Decodificar e verificar o token
            const decoded = jwt.verify(token2, SECRET_KEY);
    
            const user = await User.findByEmail(decoded.email);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
            }
    
            const { newPassword } = req.body;
    
            if (!newPassword) {
                return res.status(400).json({ success: false, message: 'Nova senha não fornecida.' });
            }
    
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await User.updatePassword(user.user_id, hashedPassword);
    
            res.json({ success: true, message: 'Senha alterada com sucesso.' });
        } catch (error) {
            console.error('Erro no resetPassword:', error);
    
            if (error.name === 'TokenExpiredError') {
                return res.status(400).json({ success: false, message: 'Token expirado.' });
            }
    
            return res.status(400).json({ success: false, message: 'Token inválido ou expirado.' });
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
