const { Pool } = require("pg");
const { configDotenv } = require("dotenv");
configDotenv({ path: "./.env.local" });
const connectionString = process.env.SUPABASE_LINK; //Add your connection string from supabase :)
const pool = new Pool({
  connectionString,
});

async function connectDb() {
  try {
    await pool.connect();
    console.log("Connected to Supabase :)");
  } catch (err) {
    console.error(err);
  }
}

module.exports = {pool,connectDb}