
CREATE TABLE t_p89199296_sberbank_toy_termina.transactions (
  id SERIAL PRIMARY KEY,
  amount INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  card_mask VARCHAR(20) DEFAULT '**** 7734',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p89199296_sberbank_toy_termina.settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO t_p89199296_sberbank_toy_termina.settings (key, value) VALUES
  ('shop_name', 'МАГАЗИН №1'),
  ('terminal_id', 'TRM-00847'),
  ('min_amount', '100'),
  ('max_amount', '99999900');
