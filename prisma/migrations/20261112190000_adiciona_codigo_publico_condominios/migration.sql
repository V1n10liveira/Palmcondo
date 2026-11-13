ALTER TABLE `condominios`
ADD COLUMN `codigo_publico` VARCHAR(64) NULL;

CREATE UNIQUE INDEX `uk_condominios_codigo_publico`
ON `condominios` (`codigo_publico`);

ALTER TABLE `solicitacoes_acesso`
ADD COLUMN `mensagem` VARCHAR(50) NULL;