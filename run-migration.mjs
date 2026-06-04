// run-migration.mjs — manually run the DB migration once. Idempotent (CREATE TABLE IF NOT EXISTS).
// Use when you've added a new table to migrationbatch.ts and don't want to start the full server.
//   npm run build-main
//   node run-migration.mjs
import "dotenv/config";
import { existsSync } from "node:fs";

const distPath = "./dist/models/migrationbatch.js";
if (!existsSync(distPath)) {
    console.error("❌ Compiled output not found. Run `npm run build-main` first.");
    process.exit(1);
}

const { mirgation } = await import("./dist/models/migrationbatch.js");

console.log("Running migration...");
await mirgation();
console.log("Migration complete.");
process.exit(0);
