/**
 * Migración: Agregar trigger automático de updated_at en la tabla users
 * Esto garantiza que updated_at siempre refleje la última modificación del registro.
 */

exports.up = (pgm) => {
  // Función que actualiza el campo updated_at al momento actual
  pgm.sql(`
    CREATE OR REPLACE FUNCTION fn_set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Trigger en la tabla users: se dispara antes de cualquier UPDATE
  pgm.sql(`
    DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
    CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TRIGGER IF EXISTS trg_users_updated_at ON users;`);
  pgm.sql(`DROP FUNCTION IF EXISTS fn_set_updated_at();`);
};
