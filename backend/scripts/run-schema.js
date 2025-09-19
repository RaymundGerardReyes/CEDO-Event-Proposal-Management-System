require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

(async () => {
    const host = process.env.DB_HOST || process.env.POSTGRES_HOST || "localhost";
    const port = Number(process.env.DB_PORT || process.env.POSTGRES_PORT || 5432);
    const user = process.env.DB_USER || process.env.POSTGRES_USER || "postgres";
    const password = process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || "";
    const database = process.env.DB_NAME || process.env.POSTGRES_DATABASE || "cedo_auth";

    const schemaFile = path.resolve(__dirname, "..", "..", "CEDO_Database_Schema_PostgreSQL.sql");
    const sql = fs.readFileSync(schemaFile, "utf8");

    console.log("Ensuring database exists...", database);
    const adminClient = new Client({ host, port, user, password, database: "postgres" });
    await adminClient.connect();
    const existsRes = await adminClient.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [database]
    );
    if (existsRes.rowCount === 0) {
        const safeDbIdent = '"' + database.replace(/"/g, '""') + '"';
        await adminClient.query(`CREATE DATABASE ${safeDbIdent}`);
        console.log(`Created database ${database}`);
    } else {
        console.log(`Database ${database} already exists`);
    }
    await adminClient.end();

    console.log("Applying schema from:", schemaFile);
    const dbClient = new Client({ host, port, user, password, database });
    await dbClient.connect();
    await dbClient.query(sql);
    await dbClient.end();

    console.log("Schema applied successfully.");
})().catch((err) => {
    console.error("Failed to apply schema:", err.message);
    process.exit(1);
});


