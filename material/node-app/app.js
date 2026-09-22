// 🔥 APM TEM QUE SER A PRIMEIRA COISA CARREGADA
const apm = require('elastic-apm-node').start({
  serviceName: 'hello-app',
  serverUrl: process.env.ELASTIC_APM_SERVER_URL || 'ip-do-seu-elastic',
  environment: process.env.NODE_ENV || 'development'
});

const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');


// =====================================================
// 📁 SQLITE
// =====================================================

// Docker:
// DATA_DIR=/app/data
//
// Fora do Docker:
// usa automaticamente ./data
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');

// Cria a pasta caso ainda não exista
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao abrir SQLite:', err.message);
    return;
  }

  console.log(`✅ SQLite conectado: ${dbPath}`);
});


// =====================================================
// 🧱 CRIA TABELA
// =====================================================

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    )
  `);
});


// =====================================================
// 🌐 SERVIDOR HTTP
// =====================================================

const server = http.createServer((req, res) => {

  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);


  // ===================================================
  // ❤️ HEALTH CHECK
  // ===================================================

  if (req.url === '/health') {
    res.writeHead(200, {
      'Content-Type': 'text/plain'
    });

    return res.end('OK');
  }


  // ===================================================
  // ➕ INSERIR USUÁRIO
  // ===================================================

  if (req.url === '/add') {

    const span = apm.startSpan(
      'INSERT user',
      'db',
      'sqlite',
      'query'
    );

    db.run(
      'INSERT INTO users (name) VALUES (?)',
      ['Jessyka'],
      (err) => {

        if (span) {
          span.end();
        }

        if (err) {
          console.error('❌ Erro no INSERT:', err);

          res.writeHead(500, {
            'Content-Type': 'text/plain'
          });

          return res.end('Erro ao inserir');
        }

        res.writeHead(200, {
          'Content-Type': 'text/plain'
        });

        res.end('User added');
      }
    );

    return;
  }


  // ===================================================
  // 📄 LISTAR USUÁRIOS
  // ===================================================

  if (req.url === '/list') {

    const span = apm.startSpan(
      'SELECT users',
      'db',
      'sqlite',
      'query'
    );

    db.all(
      'SELECT * FROM users',
      [],
      (err, rows) => {

        if (span) {
          span.end();
        }

        if (err) {
          console.error('❌ Erro no SELECT:', err);

          res.writeHead(500, {
            'Content-Type': 'text/plain'
          });

          return res.end('Erro no banco');
        }

        res.writeHead(200, {
          'Content-Type': 'application/json'
        });

        res.end(JSON.stringify(rows));
      }
    );

    return;
  }


  // ===================================================
  // 💥 GERAR ERRO PARA TESTAR APM
  // ===================================================

  if (req.url === '/error') {

    const error = new Error('Erro de teste com banco');

    apm.captureError(error);

    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });

    return res.end('Erro de teste enviado para o APM');
  }


  // ===================================================
  // 🚀 ROTA PRINCIPAL
  // ===================================================

  res.writeHead(200, {
    'Content-Type': 'text/plain'
  });

  res.end('Hello OK');
});


// =====================================================
// 🚀 START
// =====================================================

const PORT = process.env.PORT || 3005;

server.listen(PORT, '0.0.0.0', () => {

  console.log('');
  console.log('======================================');
  console.log('🚀 HELLO-APP INICIADO');
  console.log('======================================');
  console.log(`🌐 Porta: ${PORT}`);
  console.log(`📦 SQLite: ${dbPath}`);
  console.log(`📊 APM: ${process.env.ELASTIC_APM_SERVER_URL || 'ip-do-seu-elastic'}`);
  console.log('');
  console.log('Rotas disponíveis:');
  console.log('❤️  /health');
  console.log('➕ /add');
  console.log('📄 /list');
  console.log('💥 /error');
  console.log('======================================');
});