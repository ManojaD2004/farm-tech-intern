const { Pool } = require('pg');

class MandiDatabase {
  constructor() {
    const connectionString = "postgresql://postgres.bpghpskockfbsxskqlfv:Rahulla2005!@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";
    this.pool = new Pool({ connectionString });
  }
  async connectDb() {
    try {
      await this.pool.connect();
      console.log('Connected to Supabase :)');
    } catch (err) {
      console.error('Database connection error:', err);
    }
  }
  async insertIntoLocation(district, state) {
    let locationId;
    const selectLocationQuery = "SELECT location_id FROM location WHERE district = $1 AND state = $2;";
    const selectLocationResult = await this.pool.query(selectLocationQuery, [district, state]);

    if (selectLocationResult.rows.length === 0) {
      const insertLocationQuery = "INSERT INTO location (district, state) VALUES ($1, $2) RETURNING location_id;";
      const insertLocationResult = await this.pool.query(insertLocationQuery, [district, state]);
      locationId = insertLocationResult.rows[0].location_id;
    } else {
      locationId = selectLocationResult.rows[0].location_id;
    }

    return locationId;
  }

  async insertIntoMandi(phone_num, locationId, name) {
    let mandiId;
    const insertMandiQuery = `
      INSERT INTO mstr_mandi (phone_number, location_id, name)
      VALUES ($1, $2, $3)
      ON CONFLICT (phone_number) DO NOTHING
      RETURNING mandi_id;
    `;

    const mandiResult = await this.pool.query(insertMandiQuery, [phone_num, locationId, name]);

    if (mandiResult.rows.length > 0) {
      mandiId = mandiResult.rows[0].mandi_id;
    } else {
      const selectMandiQuery = "SELECT mandi_id FROM mstr_mandi WHERE phone_number = $1;";
      const selectMandiResult = await this.pool.query(selectMandiQuery, [phone_num]);
      mandiId = selectMandiResult.rows[0].mandi_id;
    }

    return mandiId;
  }
  async insertIntoCommodity(cmd_name) {
    const insertCommodityQuery = `
      INSERT INTO commodity (name)
      VALUES (LOWER($1))
      ON CONFLICT (name) DO UPDATE
      SET name = EXCLUDED.name
      RETURNING commodity_id;
    `;

    const commodityResult = await this.pool.query(insertCommodityQuery, [cmd_name]);
    return commodityResult.rows[0].commodity_id;
  }
  async insertIntoCommodityPrice(commodityId, locationId, mandiId, cmd_price) {
    const insertCommodityPriceQuery = `
      INSERT INTO commodity_price (commodity_id, location_id, mandi_id, grade_price)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const commodityPriceResult = await this.pool.query(insertCommodityPriceQuery, [commodityId, locationId, mandiId, cmd_price]);
    console.log('Inserted Commodity Price:', commodityPriceResult.rows[0]);
    return commodityPriceResult.rows[0];
  }

  async insertMandiData(data) {
    const { phone_num, name, state, district, cmd_name, cmd_price } = data.mandi;
    try {
      const locationId = await this.insertIntoLocation(district, state);
      const mandiId = await this.insertIntoMandi(phone_num, locationId, name);
      const commodityId = await this.insertIntoCommodity(cmd_name);
      await this.insertIntoCommodityPrice(commodityId, locationId, mandiId, cmd_price);
    } catch (err) {
      console.error('Error inserting mandi data:', err);
    }
  }
}

(async () => {
    const db = new MandiDatabase();
  
    await db.connectDb();
  
    const mandiData = {
      mandi: {
        phone_num: "+2-920-565-1234",
        name: "john doe",
        state: "Karnataka",
        district: "Bgalkote",
        cmd_name: "Apple",
        cmd_price: "125.00"
      }
    };
  
    await db.insertMandiData(mandiData);
    console.log("Mandi Data inserted successfully :)");
  })();
  
