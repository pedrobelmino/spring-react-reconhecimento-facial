CREATE TABLE acompanhamento_nutricional (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    data_consulta DATE NOT NULL,
    peso_kg DECIMAL(5, 2) NULL,
    profissional VARCHAR(120) NULL,
    objetivo VARCHAR(200) NULL,
    orientacoes VARCHAR(2000) NULL,
    proxima_consulta DATE NULL,
    status ENUM('ATIVO', 'INATIVO') NOT NULL DEFAULT 'ATIVO',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_acompanhamento_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (id)
);
CREATE INDEX idx_acompanhamento_cliente_data ON acompanhamento_nutricional (cliente_id, data_consulta DESC);
