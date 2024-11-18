const express = require('express');
const session = require('express-session'); // Adicione esta linha para importar o session
const bodyParser = require('body-parser');
const cors = require('cors');
const camisasRoutes = require('./routes/camisasRoutes');
const usersRoutes = require('./routes/usersRoutes');
const freteRoutes = require('./routes/freteRoutes'); 
const comentarioRouter = require('./routes/comentarioRouter');
const authRoutes = require('./routes/authRoutes');
const path = require('path')



const app = express();
app.use(bodyParser.json());
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'seu-segredo',      // Chave secreta para assinatura do ID da sessão
    resave: false,              // Impede que a sessão seja salva em cada requisição, mesmo sem alterações
    saveUninitialized: false,   // Não salva sessões não modificadas
    cookie: {
        maxAge: 1000 * 60 * 60 * 24  // Sessão dura 1 dia (24 horas)
    }
}));
app.use(authRoutes);

// Configuração de arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '/frontend/paginas/login/uploads')));
app.use(express.static(path.join(__dirname, 'frontend')));

// Rota padrão para a página inicial ou outras páginas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/'));  // Redireciona para a página de login
});

app.use('/auth', authRoutes);
app.use('/camisas', camisasRoutes);  
app.use('/users', usersRoutes);  
app.use('/frete', freteRoutes);
app.use('/api/roupas', comentarioRouter);


app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
