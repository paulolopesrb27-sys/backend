require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

if (process.env.NODE_ENV === 'production') {
    const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
    const missing = required.filter((name) => !process.env[name]);
    if (missing.length > 0) throw new Error(`Variáveis de produção ausentes: ${missing.join(', ')}.`);
    if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET deve conter pelo menos 32 caracteres.');
}

const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? true : undefined,
    connectionLimit: 10
});

module.exports = new PrismaClient({ adapter });