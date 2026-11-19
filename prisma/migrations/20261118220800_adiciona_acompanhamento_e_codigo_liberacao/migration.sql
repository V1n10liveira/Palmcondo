ALTER TABLE `solicitacoes_acesso`
ADD COLUMN `token_acompanhamento_hash` CHAR(64) NULL,
ADD COLUMN `codigo_liberacao_criptografado` VARCHAR(255) NULL,
ADD COLUMN `codigo_liberacao_hash` CHAR(64) NULL,
ADD COLUMN `codigo_expira_em` DATETIME(0) NULL;

CREATE UNIQUE INDEX `uk_solicitacoes_token_hash`
ON `solicitacoes_acesso` (`token_acompanhamento_hash`);

CREATE UNIQUE INDEX `uk_solicitacoes_codigo_hash`
ON `solicitacoes_acesso` (`codigo_liberacao_hash`);