CREATE TABLE `moradores_visitantes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `morador_id` BIGINT UNSIGNED NOT NULL,
    `pessoa_id` BIGINT UNSIGNED NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE INDEX `uk_moradores_visitantes` (`morador_id`, `pessoa_id`),
    INDEX `idx_moradores_visitantes_pessoa` (`pessoa_id`),

    CONSTRAINT `moradores_visitantes_morador_id_fkey`
        FOREIGN KEY (`morador_id`) REFERENCES `moradores` (`id`),

    CONSTRAINT `moradores_visitantes_pessoa_id_fkey`
        FOREIGN KEY (`pessoa_id`) REFERENCES `pessoas` (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
