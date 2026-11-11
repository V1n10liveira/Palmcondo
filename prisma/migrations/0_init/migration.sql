-- CreateTable
CREATE TABLE `aberturas_portao` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `portao_id` BIGINT UNSIGNED NOT NULL,
    `usuario_id` BIGINT UNSIGNED NULL,
    `autorizacao_id` BIGINT UNSIGNED NULL,
    `data_hora` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `origem` ENUM('APLICATIVO', 'AUTOMATICO', 'ADMINISTRATIVO') NOT NULL,
    `resultado` ENUM('SUCESSO', 'FALHA') NOT NULL,
    `observacao` TEXT NULL,

    INDEX `fk_aberturas_autorizacao`(`autorizacao_id`),
    INDEX `idx_aberturas_data`(`data_hora`),
    INDEX `idx_aberturas_portao`(`portao_id`),
    INDEX `idx_aberturas_usuario`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `acessos` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `condominio_id` BIGINT UNSIGNED NOT NULL,
    `autorizacao_id` BIGINT UNSIGNED NULL,
    `solicitacao_acesso_id` BIGINT UNSIGNED NULL,
    `morador_id` BIGINT UNSIGNED NULL,
    `colaborador_id` BIGINT UNSIGNED NULL,
    `pessoa_id` BIGINT UNSIGNED NULL,
    `portao_id` BIGINT UNSIGNED NOT NULL,
    `data_hora_entrada` DATETIME(0) NOT NULL,
    `data_hora_saida` DATETIME(0) NULL,
    `status` ENUM('ABERTO', 'FINALIZADO', 'BLOQUEADO') NOT NULL DEFAULT 'ABERTO',
    `observacao` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_acessos_condominio`(`condominio_id`),
    INDEX `fk_acessos_portao`(`portao_id`),
    INDEX `fk_acessos_solicitacao`(`solicitacao_acesso_id`),
    INDEX `idx_acessos_autorizacao`(`autorizacao_id`),
    INDEX `idx_acessos_morador`(`morador_id`),
    INDEX `idx_acessos_colaborador`(`colaborador_id`),
    INDEX `idx_acessos_pessoa`(`pessoa_id`),
    INDEX `idx_acessos_entrada`(`data_hora_entrada`),
    INDEX `idx_acessos_saida`(`data_hora_saida`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `apartamentos` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `condominio_id` BIGINT UNSIGNED NOT NULL,
    `bloco` VARCHAR(50) NULL,
    `numero` VARCHAR(20) NOT NULL,
    `andar` VARCHAR(20) NULL,
    `descricao` VARCHAR(150) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_apartamentos_condominio`(`condominio_id`),
    UNIQUE INDEX `uk_apartamento`(`condominio_id`, `bloco`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `autorizacoes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `condominio_id` BIGINT UNSIGNED NOT NULL,
    `morador_id` BIGINT UNSIGNED NULL,
    `pessoa_id` BIGINT UNSIGNED NOT NULL,
    `data_inicio` DATETIME(0) NOT NULL,
    `data_fim` DATETIME(0) NOT NULL,
    `hora_inicio` VARCHAR(5) NOT NULL,
    `hora_fim` VARCHAR(5) NOT NULL,
    `motivo` VARCHAR(255) NULL,
    `status` ENUM('PENDENTE', 'ATIVA', 'UTILIZADA', 'EXPIRADA', 'CANCELADA', 'BLOQUEADA') NOT NULL DEFAULT 'ATIVA',
    `observacao` TEXT NULL,
    `criado_por` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_autorizacoes_condominio`(`condominio_id`),
    INDEX `fk_autorizacoes_criado_por`(`criado_por`),
    INDEX `idx_autorizacoes_morador`(`morador_id`),
    INDEX `idx_autorizacoes_pessoa`(`pessoa_id`),
    INDEX `idx_autorizacoes_periodo`(`data_inicio`, `data_fim`),
    INDEX `idx_autorizacoes_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `colaboradores` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `usuario_id` BIGINT UNSIGNED NOT NULL,
    `cargo` VARCHAR(100) NOT NULL,
    `data_admissao` DATE NULL,
    `data_desligamento` DATE NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_colaboradores_usuario`(`usuario_id`),
    INDEX `idx_colaboradores_cargo`(`cargo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `condominios` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(150) NOT NULL,
    `cnpj` VARCHAR(18) NULL,
    `endereco` VARCHAR(200) NOT NULL,
    `numero` VARCHAR(20) NULL,
    `complemento` VARCHAR(100) NULL,
    `bairro` VARCHAR(100) NULL,
    `cidade` VARCHAR(100) NOT NULL,
    `estado` CHAR(2) NOT NULL,
    `cep` VARCHAR(9) NULL,
    `telefone` VARCHAR(20) NULL,
    `email` VARCHAR(150) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_condominios_cnpj`(`cnpj`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logs_sistema` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `usuario_id` BIGINT UNSIGNED NULL,
    `acao` VARCHAR(100) NOT NULL,
    `tabela_afetada` VARCHAR(100) NULL,
    `registro_id` BIGINT UNSIGNED NULL,
    `descricao` TEXT NULL,
    `ip` VARCHAR(45) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_logs_acao`(`acao`),
    INDEX `idx_logs_data`(`created_at`),
    INDEX `idx_logs_usuario`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `moradores` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `usuario_id` BIGINT UNSIGNED NOT NULL,
    `apartamento_id` BIGINT UNSIGNED NOT NULL,
    `data_entrada` DATE NULL,
    `data_saida` DATE NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_moradores_usuario`(`usuario_id`),
    INDEX `idx_moradores_apartamento`(`apartamento_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificacoes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `usuario_id` BIGINT UNSIGNED NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `tipo` VARCHAR(50) NULL,
    `lida` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_notificacoes_lida`(`lida`),
    INDEX `idx_notificacoes_usuario`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `portoes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `condominio_id` BIGINT UNSIGNED NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `tipo` ENUM('SOCIAL', 'GARAGEM', 'OUTRO') NOT NULL DEFAULT 'OUTRO',
    `localizacao` VARCHAR(150) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_portoes_condominio`(`condominio_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pessoas` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `condominio_id` BIGINT UNSIGNED NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `cpf` VARCHAR(14) NOT NULL,
    `telefone` VARCHAR(20) NULL,
    `tipo_pessoa` ENUM('VISITANTE', 'PRESTADOR') NOT NULL,
    `observacao` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_pessoas_nome`(`nome`),
    INDEX `idx_pessoas_tipo`(`tipo_pessoa`),
    UNIQUE INDEX `uk_pessoas_condominio_cpf`(`condominio_id`, `cpf`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prestadores` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `pessoa_id` BIGINT UNSIGNED NULL,
    `morador_id` BIGINT UNSIGNED NULL,
    `empresa` VARCHAR(150) NULL,
    `servico` VARCHAR(150) NOT NULL,
    `observacao` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_prestadores_pessoa`(`pessoa_id`),
    INDEX `idx_prestadores_morador`(`morador_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recuperacao_senha` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `usuario_id` BIGINT UNSIGNED NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `expira_em` DATETIME(0) NOT NULL,
    `utilizado` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_recuperacao_token`(`token`),
    INDEX `idx_recuperacao_expiracao`(`expira_em`),
    INDEX `idx_recuperacao_usuario`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitacoes_acesso` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `condominio_id` BIGINT UNSIGNED NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `cpf` VARCHAR(14) NOT NULL,
    `tipo_pessoa` ENUM('VISITANTE', 'PRESTADOR') NOT NULL,
    `apartamento_destino_id` BIGINT UNSIGNED NULL,
    `data_hora_solicitacao` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `status` ENUM('PENDENTE', 'AUTORIZADA', 'NEGADA', 'EXPIRADA', 'CANCELADA') NOT NULL DEFAULT 'PENDENTE',
    `data_hora_resposta` DATETIME(0) NULL,
    `respondido_por` BIGINT UNSIGNED NULL,
    `observacao` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_solicitacoes_apartamento`(`apartamento_destino_id`),
    INDEX `fk_solicitacoes_condominio`(`condominio_id`),
    INDEX `fk_solicitacoes_respondido_por`(`respondido_por`),
    INDEX `idx_solicitacoes_cpf`(`cpf`),
    INDEX `idx_solicitacoes_data`(`data_hora_solicitacao`),
    INDEX `idx_solicitacoes_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `condominio_id` BIGINT UNSIGNED NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `senha_hash` VARCHAR(255) NOT NULL,
    `cpf` VARCHAR(14) NOT NULL,
    `telefone` VARCHAR(20) NULL,
    `tipo_usuario` ENUM('MASTER', 'SINDICO', 'MORADOR', 'COLABORADOR') NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_usuarios_email`(`email`),
    UNIQUE INDEX `uk_usuarios_cpf`(`cpf`),
    INDEX `idx_usuarios_condominio`(`condominio_id`),
    INDEX `idx_usuarios_tipo`(`tipo_usuario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitantes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(150) NOT NULL,
    `cpf` VARCHAR(14) NOT NULL,
    `telefone` VARCHAR(20) NULL,
    `observacao` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_visitantes_cpf`(`cpf`),
    INDEX `idx_visitantes_nome`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `aberturas_portao` ADD CONSTRAINT `fk_aberturas_autorizacao` FOREIGN KEY (`autorizacao_id`) REFERENCES `autorizacoes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `aberturas_portao` ADD CONSTRAINT `fk_aberturas_portao` FOREIGN KEY (`portao_id`) REFERENCES `portoes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `aberturas_portao` ADD CONSTRAINT `fk_aberturas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `acessos` ADD CONSTRAINT `fk_acessos_autorizacao` FOREIGN KEY (`autorizacao_id`) REFERENCES `autorizacoes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `acessos` ADD CONSTRAINT `fk_acessos_condominio` FOREIGN KEY (`condominio_id`) REFERENCES `condominios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `acessos` ADD CONSTRAINT `fk_acessos_portao` FOREIGN KEY (`portao_id`) REFERENCES `portoes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `acessos` ADD CONSTRAINT `fk_acessos_solicitacao` FOREIGN KEY (`solicitacao_acesso_id`) REFERENCES `solicitacoes_acesso`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `acessos` ADD CONSTRAINT `fk_acessos_morador` FOREIGN KEY (`morador_id`) REFERENCES `moradores`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `acessos` ADD CONSTRAINT `fk_acessos_colaborador` FOREIGN KEY (`colaborador_id`) REFERENCES `colaboradores`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `acessos` ADD CONSTRAINT `fk_acessos_pessoa` FOREIGN KEY (`pessoa_id`) REFERENCES `pessoas`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `apartamentos` ADD CONSTRAINT `fk_apartamentos_condominio` FOREIGN KEY (`condominio_id`) REFERENCES `condominios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `autorizacoes` ADD CONSTRAINT `fk_autorizacoes_condominio` FOREIGN KEY (`condominio_id`) REFERENCES `condominios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `autorizacoes` ADD CONSTRAINT `fk_autorizacoes_criado_por` FOREIGN KEY (`criado_por`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `autorizacoes` ADD CONSTRAINT `fk_autorizacoes_morador` FOREIGN KEY (`morador_id`) REFERENCES `moradores`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `autorizacoes` ADD CONSTRAINT `fk_autorizacoes_pessoa` FOREIGN KEY (`pessoa_id`) REFERENCES `pessoas`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `colaboradores` ADD CONSTRAINT `fk_colaboradores_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `logs_sistema` ADD CONSTRAINT `fk_logs_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `moradores` ADD CONSTRAINT `fk_moradores_apartamento` FOREIGN KEY (`apartamento_id`) REFERENCES `apartamentos`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `moradores` ADD CONSTRAINT `fk_moradores_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notificacoes` ADD CONSTRAINT `fk_notificacoes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `portoes` ADD CONSTRAINT `fk_portoes_condominio` FOREIGN KEY (`condominio_id`) REFERENCES `condominios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pessoas` ADD CONSTRAINT `fk_pessoas_condominio` FOREIGN KEY (`condominio_id`) REFERENCES `condominios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `prestadores` ADD CONSTRAINT `fk_prestadores_pessoa` FOREIGN KEY (`pessoa_id`) REFERENCES `pessoas`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `prestadores` ADD CONSTRAINT `fk_prestadores_morador` FOREIGN KEY (`morador_id`) REFERENCES `moradores`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `recuperacao_senha` ADD CONSTRAINT `fk_recuperacao_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `solicitacoes_acesso` ADD CONSTRAINT `fk_solicitacoes_apartamento` FOREIGN KEY (`apartamento_destino_id`) REFERENCES `apartamentos`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `solicitacoes_acesso` ADD CONSTRAINT `fk_solicitacoes_condominio` FOREIGN KEY (`condominio_id`) REFERENCES `condominios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `solicitacoes_acesso` ADD CONSTRAINT `fk_solicitacoes_respondido_por` FOREIGN KEY (`respondido_por`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `fk_usuarios_condominio` FOREIGN KEY (`condominio_id`) REFERENCES `condominios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Preserva a regra de exatamente um responsavel por acesso.
ALTER TABLE `acessos`
ADD CONSTRAINT `chk_acessos_exatamente_um_responsavel`
CHECK (
    (
        (`morador_id` IS NOT NULL) +
        (`colaborador_id` IS NOT NULL) +
        (`pessoa_id` IS NOT NULL)
    ) = 1
);

-- Preserva a regra de periodo valido das autorizacoes.
ALTER TABLE `autorizacoes`
ADD CONSTRAINT `chk_autorizacao_periodo`
CHECK (`data_fim` >= `data_inicio`);