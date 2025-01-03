const pool = require('../config/database');
const bcrypt = require('bcryptjs'); // Substituindo o bcrypt por bcryptjs
const crypto = require('crypto');

const User = {
    findByEmail: async (email) => {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    },
    create: async (username, email, password, profileImage) => {
        const hashedPassword = await bcrypt.hash(password, 10); // Usando bcryptjs
        const result = await pool.query(
            'INSERT INTO users (username, email, password, profile_image) VALUES ($1, $2, $3, $4) RETURNING *',
            [username, email, hashedPassword, profileImage]
        );
        return result.rows[0];
    },
    update: async (userId, username, email, password, profileImage) => {
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10); // Usando bcryptjs
            await pool.query('UPDATE users SET password = $1 WHERE user_id = $2', [hashedPassword, userId]);
        }
        if (profileImage) {
            await pool.query('UPDATE users SET profile_image = $1 WHERE user_id = $2', [profileImage, userId]);
        }
        await pool.query('UPDATE users SET username = $1, email = $2 WHERE user_id = $3', [username, email, userId]);
    },
    findByToken: async (token) => {
        const result = await pool.query('SELECT * FROM users WHERE reset_token = $1', [token]);
        return result.rows[0];
    },
    setResetToken: async (email, token) => {
        const expiration = new Date(Date.now() + 3600000); // 1 hora
        await pool.query('UPDATE users SET reset_token = $1, reset_token_expiration = $2 WHERE email = $3', [token, expiration, email]);
    },
    updatePassword: async (userId, newPassword) => {
        const result = await pool.query('UPDATE users SET password = $1 WHERE user_id = $2', [newPassword, userId]);
        return result.rowCount;  // Retorna o número de linhas afetadas
    }
};

module.exports = User;
