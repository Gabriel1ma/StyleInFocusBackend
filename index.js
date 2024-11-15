const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const camisasRoutes = require('./routes/camisasRoutes');
const usersRoutes = require('./routes/usersRoutes');
const freteRoutes = require('./routes/freteRoutes'); 
const comentarioRouter = require('./routes/comentarioRouter');

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.use('/camisas', camisasRoutes);  
app.use('/users', usersRoutes);  
app.use('/frete', freteRoutes);
app.use('/api/roupas', comentarioRouter);


app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
