-- ============================================================
-- PALMCONDO
-- Estrutura inicial do banco de dados
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS palmcondo
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE palmcondo;

-- ============================================================
-- 1. CONDOMÍNIOS
-- ============================================================

CREATE TABLE condominios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cnpj VARCHAR(18) NULL,
    endereco VARCHAR(200) NOT NULL,
    numero VARCHAR(20) NULL,
    complemento VARCHAR(100) NULL,
    bairro VARCHAR(100) NULL,
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    cep VARCHAR(9) NULL,
    telefone VARCHAR(20) NULL,
    email VARCHAR(150) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_condominios_cnpj (cnpj)
);

-- ============================================================
-- 2. APARTAMENTOS
-- ============================================================

CREATE TABLE apartamentos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    condominio_id BIGINT UNSIGNED NOT NULL,
    bloco VARCHAR(50) NULL,
    numero VARCHAR(20) NOT NULL,
    andar VARCHAR(20) NULL,
    descricao VARCHAR(150) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_apartamentos_condominio
        FOREIGN KEY (condominio_id)
        REFERENCES condominios(id),

    UNIQUE KEY uk_apartamento (
        condominio_id,
        bloco,
        numero
    ),

    INDEX idx_apartamentos_condominio (condominio_id)
);

-- ============================================================
-- 3. USUÁRIOS
-- ============================================================

CREATE TABLE usuarios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    condominio_id BIGINT UNSIGNED NOT NULL,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    telefone VARCHAR(20) NULL,
    tipo_usuario ENUM(
        'MASTER',
        'SINDICO',
        'MORADOR',
        'COLABORADOR'
    ) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuarios_condominio
        FOREIGN KEY (condominio_id)
        REFERENCES condominios(id),

    UNIQUE KEY uk_usuarios_email (email),
    UNIQUE KEY uk_usuarios_cpf (cpf),

    INDEX idx_usuarios_condominio (condominio_id),
    INDEX idx_usuarios_tipo (tipo_usuario)
);

-- ============================================================
-- 4. MORADORES
-- ============================================================

CREATE TABLE moradores (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT UNSIGNED NOT NULL,
    apartamento_id BIGINT UNSIGNED NOT NULL,
    data_entrada DATE NULL,
    data_saida DATE NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_moradores_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id),

    CONSTRAINT fk_moradores_apartamento
        FOREIGN KEY (apartamento_id)
        REFERENCES apartamentos(id),

    UNIQUE KEY uk_moradores_usuario (usuario_id),

    INDEX idx_moradores_apartamento (apartamento_id)
);

-- ============================================================
-- 5. COLABORADORES
-- ============================================================

CREATE TABLE colaboradores (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT UNSIGNED NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    data_admissao DATE NULL,
    data_desligamento DATE NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_colaboradores_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id),

    UNIQUE KEY uk_colaboradores_usuario (usuario_id),

    INDEX idx_colaboradores_cargo (cargo)
);

-- ============================================================
-- 6. VISITANTES
-- ============================================================

CREATE TABLE visitantes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    telefone VARCHAR(20) NULL,
    observacao TEXT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_visitantes_cpf (cpf),
    INDEX idx_visitantes_nome (nome)
);

-- ============================================================
-- 7. PRESTADORES
-- ============================================================

CREATE TABLE prestadores (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    empresa VARCHAR(150) NULL,
    telefone VARCHAR(20) NULL,
    servico VARCHAR(150) NOT NULL,
    observacao TEXT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_prestadores_cpf (cpf),
    INDEX idx_prestadores_nome (nome)
);

-- ============================================================
-- 8. PORTÕES
-- ============================================================

CREATE TABLE portoes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    condominio_id BIGINT UNSIGNED NOT NULL,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM(
        'SOCIAL',
        'GARAGEM',
        'OUTRO'
    ) NOT NULL DEFAULT 'OUTRO',
    localizacao VARCHAR(150) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_portoes_condominio
        FOREIGN KEY (condominio_id)
        REFERENCES condominios(id),

    INDEX idx_portoes_condominio (condominio_id)
);

-- ============================================================
-- 9. AUTORIZAÇÕES
-- ============================================================

CREATE TABLE autorizacoes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    condominio_id BIGINT UNSIGNED NOT NULL,
    morador_id BIGINT UNSIGNED NULL,
    visitante_id BIGINT UNSIGNED NULL,
    prestador_id BIGINT UNSIGNED NULL,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NOT NULL,
    motivo VARCHAR(255) NULL,
    status ENUM(
        'PENDENTE',
        'ATIVA',
        'UTILIZADA',
        'EXPIRADA',
        'CANCELADA',
        'BLOQUEADA'
    ) NOT NULL DEFAULT 'ATIVA',
    observacao TEXT NULL,
    criado_por BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_autorizacoes_condominio
        FOREIGN KEY (condominio_id)
        REFERENCES condominios(id),

    CONSTRAINT fk_autorizacoes_morador
        FOREIGN KEY (morador_id)
        REFERENCES moradores(id),

    CONSTRAINT fk_autorizacoes_visitante
        FOREIGN KEY (visitante_id)
        REFERENCES visitantes(id),

    CONSTRAINT fk_autorizacoes_prestador
        FOREIGN KEY (prestador_id)
        REFERENCES prestadores(id),

    CONSTRAINT fk_autorizacoes_criado_por
        FOREIGN KEY (criado_por)
        REFERENCES usuarios(id),

    INDEX idx_autorizacoes_morador (morador_id),
    INDEX idx_autorizacoes_visitante (visitante_id),
    INDEX idx_autorizacoes_prestador (prestador_id),
    INDEX idx_autorizacoes_periodo (data_inicio, data_fim),
    INDEX idx_autorizacoes_status (status),

    CONSTRAINT chk_autorizacao_periodo
        CHECK (data_fim > data_inicio),

    CONSTRAINT chk_autorizacao_pessoa
        CHECK (
            (visitante_id IS NOT NULL AND prestador_id IS NULL)
            OR
            (visitante_id IS NULL AND prestador_id IS NOT NULL)
        )
);

-- ============================================================
-- 10. SOLICITAÇÕES DE ACESSO
-- ============================================================

CREATE TABLE solicitacoes_acesso (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    condominio_id BIGINT UNSIGNED NOT NULL,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    tipo_pessoa ENUM(
        'VISITANTE',
        'PRESTADOR'
    ) NOT NULL,
    apartamento_destino_id BIGINT UNSIGNED NULL,
    data_hora_solicitacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM(
        'PENDENTE',
        'AUTORIZADA',
        'NEGADA',
        'EXPIRADA',
        'CANCELADA'
    ) NOT NULL DEFAULT 'PENDENTE',
    data_hora_resposta DATETIME NULL,
    respondido_por BIGINT UNSIGNED NULL,
    observacao TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_solicitacoes_condominio
        FOREIGN KEY (condominio_id)
        REFERENCES condominios(id),

    CONSTRAINT fk_solicitacoes_apartamento
        FOREIGN KEY (apartamento_destino_id)
        REFERENCES apartamentos(id),

    CONSTRAINT fk_solicitacoes_respondido_por
        FOREIGN KEY (respondido_por)
        REFERENCES usuarios(id),

    INDEX idx_solicitacoes_cpf (cpf),
    INDEX idx_solicitacoes_status (status),
    INDEX idx_solicitacoes_data (data_hora_solicitacao)
);

-- ============================================================
-- 11. ACESSOS
-- ============================================================

CREATE TABLE acessos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    condominio_id BIGINT UNSIGNED NOT NULL,
    autorizacao_id BIGINT UNSIGNED NULL,
    solicitacao_acesso_id BIGINT UNSIGNED NULL,
    pessoa_tipo ENUM(
        'MORADOR',
        'COLABORADOR',
        'VISITANTE',
        'PRESTADOR'
    ) NOT NULL,
    pessoa_id BIGINT UNSIGNED NOT NULL,
    portao_id BIGINT UNSIGNED NOT NULL,
    data_hora_entrada DATETIME NOT NULL,
    data_hora_saida DATETIME NULL,
    status ENUM(
        'ABERTO',
        'FINALIZADO',
        'BLOQUEADO'
    ) NOT NULL DEFAULT 'ABERTO',
    observacao TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_acessos_condominio
        FOREIGN KEY (condominio_id)
        REFERENCES condominios(id),

    CONSTRAINT fk_acessos_autorizacao
        FOREIGN KEY (autorizacao_id)
        REFERENCES autorizacoes(id),

    CONSTRAINT fk_acessos_solicitacao
        FOREIGN KEY (solicitacao_acesso_id)
        REFERENCES solicitacoes_acesso(id),

    CONSTRAINT fk_acessos_portao
        FOREIGN KEY (portao_id)
        REFERENCES portoes(id),

    INDEX idx_acessos_autorizacao (autorizacao_id),
    INDEX idx_acessos_pessoa (pessoa_tipo, pessoa_id),
    INDEX idx_acessos_entrada (data_hora_entrada),
    INDEX idx_acessos_saida (data_hora_saida)
);

-- ============================================================
-- 12. ABERTURAS DE PORTÃO
-- ============================================================

CREATE TABLE aberturas_portao (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    portao_id BIGINT UNSIGNED NOT NULL,
    usuario_id BIGINT UNSIGNED NULL,
    autorizacao_id BIGINT UNSIGNED NULL,
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    origem ENUM(
        'APLICATIVO',
        'AUTOMATICO',
        'ADMINISTRATIVO'
    ) NOT NULL,
    resultado ENUM(
        'SUCESSO',
        'FALHA'
    ) NOT NULL,
    observacao TEXT NULL,

    CONSTRAINT fk_aberturas_portao
        FOREIGN KEY (portao_id)
        REFERENCES portoes(id),

    CONSTRAINT fk_aberturas_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id),

    CONSTRAINT fk_aberturas_autorizacao
        FOREIGN KEY (autorizacao_id)
        REFERENCES autorizacoes(id),

    INDEX idx_aberturas_portao (portao_id),
    INDEX idx_aberturas_usuario (usuario_id),
    INDEX idx_aberturas_data (data_hora)
);

-- ============================================================
-- 13. NOTIFICAÇÕES
-- ============================================================

CREATE TABLE notificacoes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT UNSIGNED NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) NULL,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notificacoes_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id),

    INDEX idx_notificacoes_usuario (usuario_id),
    INDEX idx_notificacoes_lida (lida)
);

-- ============================================================
-- 14. LOGS DO SISTEMA
-- ============================================================

CREATE TABLE logs_sistema (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT UNSIGNED NULL,
    acao VARCHAR(100) NOT NULL,
    tabela_afetada VARCHAR(100) NULL,
    registro_id BIGINT UNSIGNED NULL,
    descricao TEXT NULL,
    ip VARCHAR(45) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_logs_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id),

    INDEX idx_logs_usuario (usuario_id),
    INDEX idx_logs_acao (acao),
    INDEX idx_logs_data (created_at)
);

-- ============================================================
-- 15. RECUPERAÇÃO DE SENHA
-- ============================================================

CREATE TABLE recuperacao_senha (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT UNSIGNED NOT NULL,
    token VARCHAR(255) NOT NULL,
    expira_em DATETIME NOT NULL,
    utilizado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_recuperacao_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id),

    UNIQUE KEY uk_recuperacao_token (token),

    INDEX idx_recuperacao_usuario (usuario_id),
    INDEX idx_recuperacao_expiracao (expira_em)
);