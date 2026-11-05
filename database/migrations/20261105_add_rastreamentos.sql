CREATE TABLE `rastreamentos` (
  `id_rastreamento` INT NOT NULL AUTO_INCREMENT,
  `codigo_rastreio` VARCHAR(32) NOT NULL,
  `id_pedido` INT NOT NULL,
  `status` VARCHAR(40) NOT NULL DEFAULT 'Pedido recebido',
  `criado_em` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_rastreamento`),
  UNIQUE KEY `uq_rastreamentos_codigo` (`codigo_rastreio`),
  UNIQUE KEY `uq_rastreamentos_pedido` (`id_pedido`),
  CONSTRAINT `fk_rastreamentos_pedidos` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;