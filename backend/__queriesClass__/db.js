//main db.js 
const { Pool } = require('pg');
require('dotenv').config();
class MandiDatabase {
  constructor() {
    const connectionString = process.env.CONNECTION_STRING;
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
  
  async insertIntoLocation(districtName,stateId) {
    let locationId;
    const selectLocationQuery = `SELECT location_id FROM Location WHERE district_name = $1 and state_id = $2;`;

    const selectLocationResult = await this.pool.query(selectLocationQuery, [districtName,stateId]);

    if (selectLocationResult.rows.length === 0) {
      const insertLocationQuery = `INSERT INTO Location (district_name,state_id) VALUES ($1,$2) RETURNING location_id;`
      const insertLocationResult = await this.pool.query(insertLocationQuery, [districtName,stateId]);
      locationId = insertLocationResult.rows[0].location_id;
    } else {
      locationId = selectLocationResult.rows[0].location_id;
    }

    return locationId;
  }

  async insertIntoMandi(locationId, name) {
    let mandiId;
    
      const insertMandiQuery = `
      INSERT INTO Mandi (location_id, name)
      VALUES ($1, $2)
      RETURNING mandi_id;
    `;
  
    const mandiResult = await this.pool.query(insertMandiQuery, [locationId, name]);
    mandiId = mandiResult.rows[0].mandi_id;
return mandiId
  }

  
  async insertIntoContact(mandiId, contactType, contactDetail) {
    const insertContactQuery = `
      INSERT INTO Contact (Mandi_id, Contact_type, Contact_detail)
      VALUES ($1, $2, $3)
      RETURNING contact_id;
    `;

    await this.pool.query(insertContactQuery, [mandiId, contactType, contactDetail]);
  

    }
    async insertIntoCategory(categoryName) {
      let categoryId;
      const selectCategoryQuery = `SELECT category_id FROM Category WHERE category_name = $1;`;
      const selectCategoryResult = await this.pool.query(selectCategoryQuery, [categoryName]);
  
      if (selectCategoryResult.rows.length === 0) {
          const insertCategoryQuery = `
          INSERT INTO Category (category_name)
          VALUES ($1)
          ON CONFLICT (category_name) DO NOTHING
          RETURNING category_id;
        `;
          const categoryResult = await this.pool.query(insertCategoryQuery, [categoryName]);
          categoryId = categoryResult.rows[0].category_id;
      } else {
          categoryId = selectCategoryResult.rows[0].category_id;
      }
      return categoryId;
  }
  
  
  async insertIntoCommodity(cmdName, categoryId) {
    let commodityId;
    const selectCommodityQuery = `SELECT commodity_id FROM Commodity WHERE name = LOWER($1) AND category_id = $2;`;
    const selectCommodityResult = await this.pool.query(selectCommodityQuery, [cmdName, categoryId]);

    if (selectCommodityResult.rows.length === 0) {
        const insertCommodityQuery = `
        INSERT INTO Commodity (name, category_id)
        VALUES (LOWER($1), $2)
        ON CONFLICT (name) DO NOTHING
        RETURNING commodity_id;
      `;
        const commodityResult = await this.pool.query(insertCommodityQuery, [cmdName, categoryId]);
        commodityId = commodityResult.rows[0].commodity_id;
    } else {
        commodityId = selectCommodityResult.rows[0].commodity_id;
    }
    return commodityId;
}

  async insertIntoCommodityPrice(commodityId, mandiId, gradeType, gradePrice) {
    const insertCommodityPriceQuery = `
    INSERT INTO Commodity_Price (commodity_id, mandi_id, grade_type, grade_price)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const commodityPriceResult = await this.pool.query(insertCommodityPriceQuery, [commodityId, mandiId, gradeType, gradePrice]);
  }
  async getUserExist(contactDetail) {
    const userGetQuery = `SELECT 1 FROM Contact WHERE contact_detail = $1;`;
    const userGetResult = await this.pool.query(userGetQuery, [contactDetail]);
    return userGetResult.rows.length > 0;
}

async getMandiIds(contactDetail){
  const selectMandiIDQuery = `SELECT  DISTINCT mandi_id FROM CONTACT WHERE contact_detail = $1 `
  const selectMandiIDResult = await this.pool.query(selectMandiIDQuery,[contactDetail])
  const mandiIds = selectMandiIDResult.rows.map(row => row.mandi_id);
  return mandiIds
}

async getMandiNames(mandiIds) {
  const selectMandiNameQuery = `SELECT name FROM Mandi WHERE mandi_id = ANY($1);`;
  const selectMandiNameResult = await this.pool.query(selectMandiNameQuery, [mandiIds]);
  const mandiNames =  selectMandiNameResult.rows.map(row => row.name); 
  return mandiNames
}

async getCategoriesAndCommoditiesByMandiIds(mandiIds) {

    const query = `
      SELECT 
        cat.Category_id,
        cat.Category_name,
        co.Commodity_id,
        co.Name AS commodity_name,
        cp.Grade_Type,
        cp.Grade_Price,
        m.Name AS mandi_name
      FROM Commodity_Price cp
      JOIN Commodity co ON co.Commodity_id = cp.Commodity_id
      JOIN Category cat ON cat.Category_id = co.Category_id
      JOIN Mandi m ON m.Mandi_id = cp.Mandi_id
      WHERE cp.Mandi_id = ANY($1::int[]);
    `;

    const result = await this.pool.query(query, [mandiIds]);

    console.log('Fetched Results:', result.rows);

    return result.rows;
}
  async insertMandiData(data) {
    const { uuId, name, stateName, districtName,categoryName, cmdName, gradeType, gradePrice , contact} = data.mandi;
    try {
      const stateId = await this.insertIntoStateMaster(stateName);
      const locationId = await this.insertIntoLocation(districtName,stateId);
      const mandiId = await this.insertIntoMandi(uuId, locationId, name);
      const categoryId = await this.insertIntoCategory(categoryName);
      const commodityId = await this.insertIntoCommodity(cmdName, categoryId);
      const { contactType, contactDetail } = contact;
      await this.insertIntoContact(mandiId,contactType,contactDetail);
      await this.insertIntoCommodityPrice(commodityId, mandiId, gradeType, gradePrice);
    } catch (err) {
      console.error('Error inserting mandi data:', err);
    }
  }
}
module.exports = {MandiDatabase}