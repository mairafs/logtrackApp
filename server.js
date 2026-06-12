import express from 'express';
import cors from 'cors';
import pg from 'pg';
import multer from 'multer';
import * as xlsx from 'xlsx';
import bcrypt from 'bcryptjs';

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'logtrack_db',
  password: '1590', 
  port: 5432,
});

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipping_labels (
        label_number VARCHAR(100) PRIMARY KEY,
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS order_history (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(100),
        action VARCHAR(255),
        operator_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(100) UNIQUE,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS carriers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        ean VARCHAR(100),
        sku VARCHAR(100) UNIQUE,
        description TEXT,
        photo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // =====================================================================
    // LIMPEZA AUTOMÁTICA: Apaga NFs fantasmas geradas por testes cancelados
    // =====================================================================
    await pool.query('DELETE FROM orders WHERE invoice_number NOT IN (SELECT invoice_number FROM order_history);');
    console.log('🧹 Limpeza concluída: Notas Fiscais vazias foram removidas.');

    const checkAdmin = await pool.query("SELECT * FROM users WHERE email = 'adminzig@gmail.com'");
    if (checkAdmin.rows.length === 0) {
      const hash = await bcrypt.hash('@Zig1590', 10);
      await pool.query(
        "INSERT INTO users (username, email, password, role, status) VALUES ($1, $2, $3, $4, $5)",
        ['Gestor Master', 'adminzig@gmail.com', hash, 'admin', 'active']
      );
      console.log('✅ Usuário Gênesis (adminzig) criado com sucesso!');
    }

    const checkCarriers = await pool.query("SELECT * FROM carriers");
    if (checkCarriers.rows.length === 0) {
      await pool.query("INSERT INTO carriers (name) VALUES ('Correios'), ('Loggi'), ('Jadlog'), ('Total Express')");
      console.log('✅ Transportadoras cadastradas!');
    }

  } catch (err) { console.log('Erro ao iniciar DB:', err); }
}
initDB();

async function logHistory(invoice, action, operator) {
  if (!invoice || !operator) return;
  try { 
    await pool.query('INSERT INTO order_history (invoice_number, action, operator_name) VALUES ($1, $2, $3)', [invoice.toUpperCase(), action, operator]); 
  } catch (e) { console.error('Erro log:', e); }
}

// ==========================================
// MÓDULO DE AUTENTICAÇÃO E EQUIPE
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $1', [username]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ message: 'E-mail não cadastrado.' });
    if (user.status === 'revoked') return res.status(403).json({ message: 'Acesso revogado.' });
    if (user.role === 'pending_admin') return res.status(403).json({ message: 'Seu cadastro de gestor aguarda aprovação.' });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(401).json({ message: 'Senha incorreta.' });

    res.json({ 
      success: true, token: 'token-de-acesso-liberado-123', 
      user: { id: user.id, username: user.username, email: user.email, role: user.role } 
    });
  } catch (erro) { res.status(500).json({ message: 'Erro interno' }); }
});

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const finalRole = role === 'admin' ? 'pending_admin' : 'operator';
    await pool.query("INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)", [username, email, hash, finalRole]);
    res.json({ success: true });
  } catch (erro) { 
    if (erro.code === '23505') return res.status(400).json({ message: 'E-mail já está em uso.' });
    res.status(500).json({ message: 'Erro interno' }); 
  }
});

app.get('/api/auth/me', (req, res) => res.json({ user: { id: '1', username: 'admin', role: 'admin' } }));

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, status FROM users ORDER BY created_at DESC');
    res.json({ users: result.rows });
  } catch (e) { res.status(500).json({ message: 'Erro ao buscar equipe' }); }
});

app.post('/api/users/:id/approve', async (req, res) => {
  try { await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [req.params.id]); res.json({ success: true }); } 
  catch (e) { res.status(500).json({ message: 'Erro ao aprovar' }); }
});

app.post('/api/users/:id/revoke', async (req, res) => {
  try { await pool.query("UPDATE users SET status = 'revoked' WHERE id = $1", [req.params.id]); res.json({ success: true }); } 
  catch (e) { res.status(500).json({ message: 'Erro ao revogar' }); }
});

// ==========================================
// MÓDULO DE PRODUTOS
// ==========================================
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, ean, sku, description, photo_url AS "photoUrl" FROM products ORDER BY created_at DESC');
    res.json({ products: result.rows });
  } catch (error) { res.status(500).json({ message: 'Erro ao buscar produtos' }); }
});

app.get('/api/products/code/:code', async (req, res) => {
  try {
    const code = req.params.code;
    const result = await pool.query('SELECT id, ean, sku, description, photo_url AS "photoUrl" FROM products WHERE sku = $1 OR ean = $1', [code]);
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(404).json({ message: 'Produto não encontrado' });
  } catch (error) { res.status(500).json({ message: 'Erro interno' }); }
});

app.post('/api/products/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Sem arquivo.' });
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let imported = 0, skipped = 0;

    for (const row of data) {
      const ean = row['EAN'] || row['ean'];
      const sku = row['SKU'] || row['sku'];
      const description = row['Descrição'] || row['Descricao'] || row['description'];
      const photoUrl = row['Foto'] || row['foto'] || row['photo_url'] || null;

      if (ean && sku && description) {
        try {
          await pool.query(
            `INSERT INTO products (ean, sku, description, photo_url) VALUES ($1, $2, $3, $4) ON CONFLICT (sku) DO UPDATE SET description = EXCLUDED.description, photo_url = EXCLUDED.photo_url, updated_at = CURRENT_TIMESTAMP`,
            [ean, sku, description, photoUrl]
          );
          imported++;
        } catch (e) { skipped++; }
      } else { skipped++; }
    }
    res.json({ success: true, totalRows: data.length, imported, skipped, errors: [] });
  } catch (error) { res.status(500).json({ success: false, message: 'Erro de leitura.' }); }
});

// ==========================================
// MÓDULO OPERACIONAL (SEPARAÇÃO E EMBALAGEM)
// ==========================================
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json({ orders: result.rows });
  } catch (error) { res.status(500).json({ message: 'Erro ao buscar pedidos' }); }
});

app.post('/api/orders/:invoice/status', async (req, res) => {
  try {
    const invoice = req.params.invoice.toUpperCase(); 
    const { status, operatorName } = req.body;
    
    // UPSERT: Se a NF não existe, cria com esse status. Se existe, atualiza.
    await pool.query(
      'INSERT INTO orders (invoice_number, status) VALUES ($2, $1) ON CONFLICT (invoice_number) DO UPDATE SET status = EXCLUDED.status', 
      [status, invoice]
    );

    let actionStr = `Status alterado para ${status}`;
    if (status === 'pending') actionStr = '⚠ Marcado como Pendente (Avaria/Falta)';
    await logHistory(invoice, actionStr, operatorName);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.post('/api/picking/sessions', async (req, res) => {
  try {
    const invoiceNumber = req.body.invoiceNumber.toUpperCase();
    // Não insere no DB aqui, apenas cria a sessão virtual (Lazy Creation)
    res.json({ id: invoiceNumber, invoiceNumber, status: 'active' });
  } catch (e) { res.status(500).json({ message: 'Erro interno' }); }
});

app.post('/api/picking/sessions/:id/items', (req, res) => res.json({ success: true }));

app.post('/api/picking/sessions/:id/complete', async (req, res) => {
  try {
    const invoice = req.params.id.toUpperCase();
    const { operatorName } = req.body;
    
    // UPSERT: Cria ou atualiza a NF na hora que ele de fato finaliza.
    await pool.query(
      "INSERT INTO orders (invoice_number, status) VALUES ($1, 'picked') ON CONFLICT (invoice_number) DO UPDATE SET status = EXCLUDED.status", 
      [invoice]
    );
    
    await logHistory(invoice, '✅ Separação Concluída', operatorName);
    res.json({ success: true });
  } catch (e) { res.json({ success: true }); }
});

app.post('/api/packing/sessions', async (req, res) => {
  try {
    const invoiceNumber = req.body.invoiceNumber.toUpperCase();
    // Não insere no DB aqui, apenas cria a sessão virtual (Lazy Creation)
    res.json({ id: invoiceNumber, invoiceNumber, status: 'active' });
  } catch (e) { res.status(500).json({ message: 'Erro interno' }); }
});

app.post('/api/packing/sessions/:id/items', (req, res) => res.json({ success: true }));

app.post('/api/packing/sessions/:id/complete', async (req, res) => {
  try {
    const invoice = req.params.id.toUpperCase();
    const { operatorName } = req.body;
    
    // UPSERT: Cria ou atualiza a NF na hora que ele de fato finaliza.
    await pool.query(
      "INSERT INTO orders (invoice_number, status) VALUES ($1, 'packed') ON CONFLICT (invoice_number) DO UPDATE SET status = EXCLUDED.status", 
      [invoice]
    );

    await logHistory(invoice, '📦 Embalagem Concluída', operatorName);
    res.json({ success: true });
  } catch (e) { res.json({ success: true }); }
});

// ==========================================
// MÓDULO DE EXPEDIÇÃO E TRANSPORTADORAS
// ==========================================
app.get('/api/carriers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM carriers ORDER BY name ASC');
    res.json({ carriers: result.rows });
  } catch (error) { res.status(500).json({ message: 'Erro ao buscar transportadoras' }); }
});

app.post('/api/shipping/sessions', (req, res) => {
  res.json({ id: 'ship-' + Date.now(), carrierId: req.body.carrierId, status: 'active' });
});

app.post('/api/shipping/sessions/:id/items', (req, res) => res.json({ success: true }));

app.post('/api/shipping/sessions/:id/complete', async (req, res) => {
  try {
    const { invoices, operatorName, driverIdentification } = req.body; 
    
    if (invoices && invoices.length > 0) {
      for (let label of invoices) {
        label = label.toUpperCase(); 
        await pool.query(`INSERT INTO shipping_labels (label_number) VALUES ($1) ON CONFLICT DO NOTHING`, [label]);
        await logHistory(label, `🚚 Volume Expedido (Mot: ${driverIdentification})`, operatorName);
      }
    }
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
});

// ==========================================
// DASHBOARD (KPIs) E HISTÓRICO
// ==========================================
app.get('/api/kpi/daily', async (req, res) => {
  try {
    const result = await pool.query('SELECT status, COUNT(*) as count FROM orders GROUP BY status');
    const counts = { pending: 0, picked: 0, packed: 0 };
    result.rows.forEach(row => { counts[row.status] = parseInt(row.count, 10); });
    
    const labelResult = await pool.query('SELECT COUNT(*) as count FROM shipping_labels');
    res.json({ packedByUser: counts.packed, totalToPack: counts.picked, totalPending: counts.pending, totalPacked: counts.packed, totalShipped: parseInt(labelResult.rows[0].count, 10) });
  } catch (error) { res.status(500).json({ message: 'Erro ao buscar KPIs' }); }
});

app.get('/api/history', async (req, res) => {
  try {
    const { q } = req.query;
    let queryStr = 'SELECT * FROM order_history ORDER BY created_at DESC LIMIT 100';
    let params = [];
    if (q) { queryStr = `SELECT * FROM order_history WHERE invoice_number ILIKE $1 OR operator_name ILIKE $1 OR action ILIKE $1 ORDER BY created_at DESC`; params = [`%${q}%`]; }
    const result = await pool.query(queryStr, params);
    res.json({ history: result.rows });
  } catch (error) { res.status(500).json({ message: 'Erro ao buscar histórico' }); }
});

app.listen(3000, () => { console.log('✅ Servidor LogTrack com Sistema de Auditoria Online!'); });