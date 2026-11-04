import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DB_HOST ? (() => {
    const user = encodeURIComponent(process.env.DB_USER ?? "");
    const password = encodeURIComponent(process.env.DB_PASSWORD ?? "");
    const host = process.env.DB_HOST ?? "localhost";
    const port = process.env.DB_PORT ?? "3306";
    const database = encodeURIComponent(process.env.DB_NAME ?? "");
    return `mysql://${user}:${password}@${host}:${port}/${database}`;
})() : process.env.DATABASE_URL;

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: { path: "prisma/migrations" },
    datasource: { url: databaseUrl }
});