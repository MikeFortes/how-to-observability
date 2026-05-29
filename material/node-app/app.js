// 🔥 APM TEM QUE SER A PRIMEIRA LINHA
const apm = require('elastic-apm-node').start({
  serviceName: 'hello-app',
  serverUrl: 'ip-do-seu-elastic',
  environment: 'development'
});

const http = require('http');
const sqlite3 = require('sqlite3').verbose();

// 📁 Banco local (cria automaticamente)
const db = new sqlite3.Database('./database.db');

// 🧱 Criar tabela se não existir
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    )
  `);
});

const server = http.createServer((req, res) => {

  // ❤️ Health check (pro Kuma)
  if (req.url === '/health') {
    res.writeHead(200);
    return res.end('OK');
  }

  // ➕ Inserir usuário
  if (req.url === '/add') {

    const span = apm.startSpan('INSERT user', 'db', 'sqlite', 'query');

    db.run("INSERT INTO users (name) VALUES (?)", ["Jessyka"], (err) => {
      if (span) span.end();

      if (err) {
        res.writeHead(500);
        return res.end('Erro ao inserir');
      }

      res.writeHead(200);
      res.end('User added');
    });

    return;
  }

  // 📄 Listar usuários
  if (req.url === '/list') {

    const span = apm.startSpan('SELECT users', 'db', 'sqlite', 'query');

    db.all("SELECT * FROM users", [], (err, rows) => {
      if (span) span.end();

      if (err) {
        res.writeHead(500);
        return res.end('Erro no banco');
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows));
    });

    return;
  }

  // 💥 Teste de erro (vai pro APM)
  if (req.url === '/error') {
    throw new Error('Erro de teste com banco');
  }

  // 🚀 Rota principal
  res.writeHead(200);
  res.end('Hello OK');
});

server.listen(3005, '0.0.0.0', () => {
  console.log('Servidor rodando com SQLite + APM 🚀');
});
