const express = require('express');
const router = express.Router();
const camisasController = require('../controllers/camisasController');
const pool = require('../config/database');


router.get('/', camisasController.getCamisas);
router.post('/add', camisasController.addCamisa);
router.get('/:id', camisasController.getCamisaById); 


module.exports = router;
