ALTER TABLE `clientes`
  DROP INDEX `uk_cliente_email`,
  DROP INDEX `unique_email`;

ALTER TABLE `estoque`
  DROP INDEX `id_produto_2`;