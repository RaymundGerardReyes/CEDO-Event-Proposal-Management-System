require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { Client } = require("pg");

(async () => {
    const client = new Client({
        host: process.env.DB_HOST || process.env.POSTGRES_HOST || "localhost",
        port: Number(process.env.DB_PORT || process.env.POSTGRES_PORT || 5432),
        user: process.env.DB_USER || process.env.POSTGRES_USER || "postgres",
        password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || "",
        database: process.env.DB_NAME || process.env.POSTGRES_DATABASE || "cedo_auth",
    });
    await client.connect();

    try {
        console.log("Migrating: email SMTP linkage and role-guarded outbox...");

        // 1) Ensure email_smtp_config table exists minimally
        await client.query(`
      CREATE TABLE IF NOT EXISTS email_smtp_config (
        id SERIAL PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE DEFAULT uuid_generate_v4()::text,
        smtp_server VARCHAR(255) NOT NULL,
        smtp_port INTEGER NOT NULL CHECK (smtp_port > 0),
        use_ssl BOOLEAN NOT NULL DEFAULT TRUE,
        username VARCHAR(255) NOT NULL,
        password TEXT,
        encrypted_password BYTEA,
        from_email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // 2) Unique constraint on from_email
        await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'uq_email_smtp_config_from_email'
        ) THEN
          ALTER TABLE email_smtp_config
          ADD CONSTRAINT uq_email_smtp_config_from_email UNIQUE (from_email);
        END IF;
      END $$;
    `);

        // 3) Seed smtp rows for any org contact_email not present
        // Temporarily drop email_smtp_config audit trigger to avoid audit_logs CHECK conflicts
        await client.query(`DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'email_smtp_config_audit_trigger') THEN
        DROP TRIGGER email_smtp_config_audit_trigger ON email_smtp_config;
      END IF;
    END $$;`);
        await client.query(`
      INSERT INTO email_smtp_config (smtp_server, smtp_port, use_ssl, username, password, from_email)
      SELECT 'smtp.placeholder.local', 587, TRUE, o.contact_email, 'PLACEHOLDER', o.contact_email
      FROM (
        SELECT DISTINCT contact_email FROM organizations WHERE contact_email IS NOT NULL AND contact_email <> ''
      ) o
      LEFT JOIN email_smtp_config e ON e.from_email = o.contact_email
      WHERE e.id IS NULL;
    `);
        // Recreate audit trigger if it was dropped
        await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'email_smtp_config_audit_trigger'
        ) THEN
          CREATE TRIGGER email_smtp_config_audit_trigger
          AFTER INSERT OR UPDATE OR DELETE ON email_smtp_config
          FOR EACH ROW
          EXECUTE FUNCTION email_smtp_config_audit_trigger_function();
        END IF;
      END $$;
    `);

        // 4) Add FK from organizations.contact_email -> email_smtp_config.from_email
        await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_organizations_contact_email_smtp'
        ) THEN
          ALTER TABLE organizations
          ADD CONSTRAINT fk_organizations_contact_email_smtp
          FOREIGN KEY (contact_email) REFERENCES email_smtp_config(from_email) ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

        // 5) Create email_outbox table if not exists
        await client.query(`
      CREATE TABLE IF NOT EXISTS email_outbox (
        id BIGSERIAL PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE DEFAULT uuid_generate_v4()::text,
        sender_user_id INTEGER NOT NULL,
        from_email VARCHAR(255) NOT NULL,
        to_email VARCHAR(255) NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sending','sent','failed')),
        last_error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sent_at TIMESTAMP NULL
      );
    `);

        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_email_outbox_status_created_at ON email_outbox (status, created_at DESC);
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_email_outbox_sender_user_id ON email_outbox (sender_user_id);
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_email_outbox_from_email ON email_outbox (from_email);
    `);

        // 6) FKs for email_outbox
        await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_email_outbox_sender_user_id'
        ) THEN
          ALTER TABLE email_outbox
          ADD CONSTRAINT fk_email_outbox_sender_user_id
          FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);
        await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_email_outbox_from_email'
        ) THEN
          ALTER TABLE email_outbox
          ADD CONSTRAINT fk_email_outbox_from_email
          FOREIGN KEY (from_email) REFERENCES email_smtp_config(from_email) ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

        // 7) Role guard trigger for email_outbox
        await client.query(`
      CREATE OR REPLACE FUNCTION email_outbox_role_guard()
      RETURNS TRIGGER AS $$
      DECLARE
        user_role role_type;
      BEGIN
        SELECT role INTO user_role FROM users WHERE id = NEW.sender_user_id;
        IF user_role IS NULL THEN
          RAISE EXCEPTION 'Sender user % does not exist or has no role', NEW.sender_user_id;
        END IF;
        IF user_role NOT IN ('admin','head_admin','manager') THEN
          RAISE EXCEPTION 'User % with role % is not permitted to send emails', NEW.sender_user_id, user_role;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
        await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'email_outbox_role_guard_trigger'
        ) THEN
          CREATE TRIGGER email_outbox_role_guard_trigger
          BEFORE INSERT ON email_outbox
          FOR EACH ROW
          EXECUTE FUNCTION email_outbox_role_guard();
        END IF;
      END $$;
    `);

        // 8) Analyze new tables
        await client.query(`ANALYZE email_smtp_config;`);
        await client.query(`ANALYZE organizations;`);
        await client.query(`ANALYZE email_outbox;`);

        console.log("Migration complete.");
    } catch (err) {
        console.error("Migration failed:", err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
})();


