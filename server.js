require('dotenv').config();
const http = require('http');
const app = require('./app');
const prisma = require('./database');
const port = process.env.PORT || 5001;
const server = http.createServer(app);
server.listen(port, '0.0.0.0', () => {
	console.log(`Servidor rodando na porta ${port}`);
});

function encerrar() {
	server.close(async () => {
		await prisma.$disconnect();
		process.exitCode = 0;
	});
}

process.once('SIGTERM', encerrar);
process.once('SIGINT', encerrar);
