const path = require('node:path');

process.chdir(path.resolve(__dirname, '../..'));
require(path.join(process.cwd(), 'frontend', 'sistema-rastreamento-node', 'server.js'));