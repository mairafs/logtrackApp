-- Habilita a geração de UUIDs aleatórios
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de Usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'separator', 'packer', 'shipper')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Tabela de Produtos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ean VARCHAR(20) UNIQUE NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  photo_url VARCHAR(500),
  photo_base64 TEXT,
  price DECIMAL(10, 2),
  stock INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Transportadoras
CREATE TABLE carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) UNIQUE NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pedidos
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'picking', 'packing', 'packed', 'pending_issue', 'shipped')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  packed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  shipped_by UUID REFERENCES users(id),
  carrier_id UUID REFERENCES carriers(id),
  notes TEXT
);

-- Tabela de Itens de Pedidos
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  requested_qty INT NOT NULL,
  picked_qty INT,
  packed_qty INT,
  pending_reason VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Sessões de Embalagem
CREATE TABLE packing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'completed', 'abandoned')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  FOREIGN KEY (invoice_number) REFERENCES orders(invoice_number)
);

-- Tabela de Itens de Embalagem
CREATE TABLE packing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packing_session_id UUID NOT NULL REFERENCES packing_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  is_confirmed BOOLEAN DEFAULT false,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Sessões de Separação
CREATE TABLE picking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(30) NOT NULL CHECK (status IN ('active', 'completed', 'pending_issue')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  pending_reason VARCHAR(100),
  FOREIGN KEY (invoice_number) REFERENCES orders(invoice_number)
);

-- Tabela de Itens de Separação
CREATE TABLE picking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  picking_session_id UUID NOT NULL REFERENCES picking_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  requested_qty INT NOT NULL,
  picked_qty INT NOT NULL,
  is_pending BOOLEAN DEFAULT false,
  pending_reason VARCHAR(100),
  picked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Sessões de Expedição
CREATE TABLE shipping_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id UUID NOT NULL REFERENCES carriers(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'completed')),
  driver_signature TEXT,
  driver_identification VARCHAR(100),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de Itens de Expedição
CREATE TABLE shipping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipping_session_id UUID NOT NULL REFERENCES shipping_sessions(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id),
  label_number VARCHAR(100) NOT NULL UNIQUE,
  shipped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Logs de Auditoria
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Tabela de Métricas
CREATE TABLE operator_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  role VARCHAR(20) NOT NULL,
  items_packed INT DEFAULT 0,
  items_picked INT DEFAULT 0,
  items_shipped INT DEFAULT 0,
  orders_completed INT DEFAULT 0,
  avg_time_per_order FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Tabela de Pendências
CREATE TABLE pending_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  item_id UUID REFERENCES order_items(id),
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('produto_avariado', 'nao_encontrado', 'quantidade_incorreta', 'outro')),
  description TEXT NOT NULL,
  reported_by UUID NOT NULL REFERENCES users(id),
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id),
  resolution TEXT
);

-- Tabela de Notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  action_url VARCHAR(500)
);

-- CRIAÇÃO DE ÍNDICES (FORA DAS TABELAS)
CREATE INDEX idx_username ON users (username);
CREATE INDEX idx_role ON users (role);
CREATE INDEX idx_ean ON products (ean);
CREATE INDEX idx_sku ON products (sku);
CREATE INDEX idx_code ON carriers (code);
CREATE INDEX idx_invoice_number ON orders (invoice_number);
CREATE INDEX idx_status ON orders (status);
CREATE INDEX idx_created_at ON orders (created_at);
CREATE INDEX idx_order_id ON order_items (order_id);
CREATE INDEX idx_product_id ON order_items (product_id);
CREATE INDEX idx_packing_invoice_number ON packing_sessions (invoice_number);
CREATE INDEX idx_packing_user_id ON packing_sessions (user_id);
CREATE INDEX idx_packing_status ON packing_sessions (status);
CREATE INDEX idx_packing_session_id ON packing_items (packing_session_id);
CREATE INDEX idx_picking_invoice_number ON picking_sessions (invoice_number);
CREATE INDEX idx_picking_user_id ON picking_sessions (user_id);
CREATE INDEX idx_picking_session_id ON picking_items (picking_session_id);
CREATE INDEX idx_shipping_carrier_id ON shipping_sessions (carrier_id);
CREATE INDEX idx_shipping_user_id ON shipping_sessions (user_id);
CREATE INDEX idx_shipping_session_id ON shipping_items (shipping_session_id);
CREATE INDEX idx_shipping_order_id ON shipping_items (order_id);
CREATE INDEX idx_audit_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs (timestamp);
CREATE INDEX idx_audit_entity_type ON audit_logs (entity_type);
CREATE INDEX idx_metrics_user_id ON operator_metrics (user_id);
CREATE INDEX idx_metrics_date ON operator_metrics (date);
CREATE INDEX idx_pending_order_id ON pending_issues (order_id);
CREATE INDEX idx_pending_reported_at ON pending_issues (reported_at);
CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_read ON notifications (read);
CREATE INDEX idx_orders_invoice_status ON orders(invoice_number, status);
CREATE INDEX idx_order_items_order_product ON order_items(order_id, product_id);
CREATE INDEX idx_packing_items_session ON packing_items(packing_session_id, product_id);
CREATE INDEX idx_picking_items_session ON picking_items(picking_session_id, product_id);
CREATE INDEX idx_shipping_items_session ON shipping_items(shipping_session_id, order_id);
CREATE INDEX idx_audit_logs_full ON audit_logs(user_id, timestamp, entity_type);