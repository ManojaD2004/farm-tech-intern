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
  async insertIntoStateMaster(stateName){
    const insertStateQuery = `
    INSERT INTO State_Master (state_name)
    VALUES ($1)
    ON CONFLICT (state_name) DO NOTHING
    RETURNING state_id;
  `;

  const stateResult = await this.pool.query(insertStateQuery, [stateName]);

  if (stateResult.rows.length > 0) {
    return stateResult.rows[0].state_id;
  } else {
    const selectStateQuery = 'SELECT state_id FROM State_Master WHERE state_name = $1;';
    const selectStateResult = await this.pool.query(selectStateQuery, [stateName]);
    stateId =  selectStateResult.rows[0].state_id;
    return stateId
  }
}

async insertIntoDistrictMaster(districtName, stateId) {
  const insertDistrictQuery = `
    INSERT INTO District_Master (district_name, state_id)
    VALUES ($1, $2)
    ON CONFLICT (district_name, state_id) DO NOTHING
    RETURNING district_id;
  `;

  const districtResult = await this.pool.query(insertDistrictQuery, [districtName, stateId]);

  if (districtResult.rows.length > 0) {
    districtId =  districtResult.rows[0].district_id;
    return districtId
  } else {
    const selectDistrictQuery = `
      SELECT district_id 
      FROM District_Master 
      WHERE district_name = $1 AND state_id = $2;
    `;
    const selectDistrictResult = await this.pool.query(selectDistrictQuery, [districtName, stateId]);
    districtId =  selectDistrictResult.rows[0].district_id;
    return districtId
  }
}
  
  async insertIntoLocation(districtId) {
    let locationId;
    const selectLocationQuery = `SELECT location_id FROM Location WHERE district_id = $1;`
    const selectLocationResult = await this.pool.query(selectLocationQuery, [districtId]);

    if (selectLocationResult.rows.length === 0) {
      const insertLocationQuery = `INSERT INTO Location (district_id) VALUES ($1) RETURNING location_id;`
      const insertLocationResult = await this.pool.query(insertLocationQuery, [districtId]);
      locationId = insertLocationResult.rows[0].location_id;
    } else {
      locationId = selectLocationResult.rows[0].location_id;
    }

    return locationId;
  }
  

  async insertIntoCategory(categoryName) {
    const insertCategoryQuery = `
      INSERT INTO Category (category_name)
      VALUES ($1)
      ON CONFLICT (category_name) DO NOTHING
      RETURNING category_id;
    `;

    const categoryResult = await this.pool.query(insertCategoryQuery, [categoryName]);

    if (categoryResult.rows.length > 0) {
      categoryId =  categoryResult.rows[0].category_id;
      return categoryId
    } else {
      const selectCategoryQuery = 'SELECT category_id FROM Category WHERE category_name = $1;';
      const selectCategoryResult = await this.pool.query(selectCategoryQuery, [categoryName]);
      categoryId =  selectCategoryResult.rows[0].category_id;
      return categoryId
    }
  }

  async insertIntoMandi(uuId, locationId, name) {
    let mandiId;
    const insertMandiQuery = `
      INSERT INTO Mandi (uu_id, location_id, name)
      VALUES ($1, $2, $3)
      ON CONFLICT (uu_id) DO NOTHING
      RETURNING mandi_id;
    `;

    const mandiResult = await this.pool.query(insertMandiQuery, [uuId, locationId, name]);

    if (mandiResult.rows.length > 0) {
      mandiId = mandiResult.rows[0].mandi_id;
    } else {
      const selectMandiQuery = `SELECT mandi_id FROM Mandi WHERE uu_id = $1;`
      const selectMandiResult = await this.pool.query(selectMandiQuery, [uuId]);
      mandiId = selectMandiResult.rows[0].mandi_id;
    }

    return mandiId;
  }
  async insertIntoCommodity(cmdName, categoryId) {
    const insertCommodityQuery = `
      INSERT INTO Commodity (name, category_id)
      VALUES (LOWER($1), $2)
      ON CONFLICT (name) DO NOTHING
      RETURNING commodity_id;
    `;

    const commodityResult = await this.pool.query(insertCommodityQuery, [cmdName, categoryId]);

    if (commodityResult.rows.length > 0) {
      commodityId =  commodityResult.rows[0].commodity_id;
      return commodityId
    } else {
      const selectCommodityQuery = 'SELECT commodity_id FROM Commodity WHERE name = LOWER($1);';
      const selectCommodityResult = await this.pool.query(selectCommodityQuery, [cmdName]);
      commodityId =  selectCommodityResult.rows[0].commodity_id;
      return commodityId    
    }
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
module.exports = {MandiDatabase}