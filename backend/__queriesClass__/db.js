const { Pool } = require('pg');

class MandiDatabase {
  constructor() {
    const connectionString = ;
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
    let stateId
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
  let districtId
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
    let categoryId
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
    let commodityId
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
  async insertIntoCommodityPrice(commodityId, mandiId, gradeType, gradePrice) {
    const insertCommodityPriceQuery = `
    INSERT INTO Commodity_Price (commodity_id, mandi_id, grade_type, grade_price)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const commodityPriceResult = await this.pool.query(insertCommodityPriceQuery, [commodityId, mandiId, gradeType, gradePrice]);
  console.log('Inserted Commodity Price:', commodityPriceResult.rows[0]);
  }

  async insertMandiData(data) {
    const { uuId, name, stateName, districtName, cmdName, categoryName, gradeType, gradePrice } = data.mandi;
    try {
      const stateId = await this.insertIntoStateMaster(stateName);
      const districtId = await this.insertIntoDistrictMaster(districtName, stateId);
      const locationId = await this.insertIntoLocation(districtId);
      const mandiId = await this.insertIntoMandi(uuId, locationId, name);
      const categoryId = await this.insertIntoCategory(categoryName);
      const commodityId = await this.insertIntoCommodity(cmdName, categoryId);
      await this.insertIntoCommodityPrice(commodityId, mandiId, gradeType, gradePrice);
    } catch (err) {
      console.error('Error inserting mandi data:', err);
    }
  }
}

module.exports = {MandiDatabase}