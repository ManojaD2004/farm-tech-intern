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

async function inserMandiData(data) {
  try {
    if (pool.ended) {
      console.log("Pool not connected right!");
      return;
    }
    const { phone_num, name, state, district, cmd_name, cmd_price } =
      data.mandi;
    let locationId;
    let commodityId;
    let mandiId;
    //Inserting into loction
    const selectQuery =
      "SELECT location_id from location WHERE district = $1 and state = $2;";
    const selectQueryResult = await pool.query(selectQuery, [district, state]);
    if (selectQueryResult.rows.length === 0) {
      const locationInsertQuery =
        "INSERT INTO location (district,state) VALUES($1,$2) RETURNING location_id ;  ";
      const queryResult = await pool.query(locationInsertQuery, [
        district,
        state,
      ]);
      locationId = queryResult.rows[0].location_id;
    } else {
      locationId = selectQueryResult.rows[0].location_id;
    }

    //Inserting into Mstr_Mandi
    const mstrMandiInsertQuery = `
        INSERT INTO mstr_mandi (phone_number, location_id, name)
        VALUES($1, $2, $3)
        ON CONFLICT(phone_number) DO NOTHING
        RETURNING mandi_id;
    `;

    const mandiQueryResult = await pool.query(mstrMandiInsertQuery, [
      phone_num,
      locationId,
      name,
    ]);

    if (mandiQueryResult.rows.length > 0) {
      mandiId = mandiQueryResult.rows[0].mandi_id;
    } else {
      const selectMandiIdQuery =
        "SELECT mandi_id FROM mstr_mandi WHERE phone_number = $1;";
      const mandiSelectQueryResult = await pool.query(selectMandiIdQuery, [
        phone_num,
      ]);
      mandiId = mandiSelectQueryResult.rows[0].mandi_id;
    }

    console.log("Mandi ID:", mandiId);

    //Inserting into commodity
    const commodityInsertQuery =
      `INSERT INTO commodity (name) 
      VALUES($1) 
      ON CONFLICT(name) DO UPDATE
      SET name = EXCLUDED.name 
      RETURNING commodity_id ;`;
      const commodityQueryResult = await pool.query(commodityInsertQuery, [cmd_name]);
      commodityId = commodityQueryResult.rows[0].commodity_id;
      console.log(commodityQueryResult.rows[0].commodityId);
    
  
    //Inserting into commodity_price
    const commodityPriceInsertQuery =
      "INSERT INTO commodity_price (commodity_id,location_id,mandi_id,grade_price) VALUES($1,$2,$3,$4) RETURNING * ;";
    const commodityPriceQueryResult = await pool.query(
      commodityPriceInsertQuery,
      [commodityId, locationId, mandiId, cmd_price]
    );
    console.log(commodityPriceQueryResult.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
}
connectDb();
console.log("Connected Started!");
// inserMandiData(mandiData);
// console.log("Mandi Data inserted successfully :)");
module.exports = { inserMandiData };
