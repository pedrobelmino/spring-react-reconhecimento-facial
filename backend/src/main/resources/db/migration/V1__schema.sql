CREATE TABLE admin_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_admin_user_username UNIQUE (username)
);

CREATE TABLE cliente (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    cpf VARCHAR(11) NOT NULL,
    status ENUM('ATIVO', 'INATIVO') NOT NULL DEFAULT 'ATIVO',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_cliente_cpf UNIQUE (cpf)
);

CREATE TABLE face_foto (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    ordem TINYINT NOT NULL,
    storage_key VARCHAR(255) NOT NULL,
    embedding VARBINARY(2048) NOT NULL,
    embedding_dim SMALLINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_face_foto_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (id),
    CONSTRAINT uk_face_foto_cliente_ordem UNIQUE (cliente_id, ordem)
);

CREATE TABLE evento_acesso (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT NULL,
    resultado ENUM('LIBERADO', 'NEGADO') NOT NULL,
    motivo ENUM('NAO_RECONHECIDO', 'CLIENTE_INATIVO') NULL,
    confianca DECIMAL(5, 4) NULL,
    ocorrido_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cooldown_key VARCHAR(64) NULL,
    CONSTRAINT fk_evento_acesso_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (id)
);

CREATE INDEX idx_evento_acesso_cliente_ocorrido ON evento_acesso (cliente_id, ocorrido_em);
CREATE INDEX idx_evento_acesso_cooldown_ocorrido ON evento_acesso (cooldown_key, ocorrido_em);
