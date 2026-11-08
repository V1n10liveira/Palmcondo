const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

router.get('/database', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            sistema: 'Palmcondo',
            database: 'conectado'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            sistema: 'Palmcondo',
            database: 'erro'
        });
    }
});

module.exports = router;