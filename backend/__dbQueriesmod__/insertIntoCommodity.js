async function insertIntoCommodity(pool,cmd_name){
    let commodityId
    const commodityInsertQuery =
          `INSERT INTO commodity (name) 
          VALUES(LOWER($1)) 
          ON CONFLICT(name) DO UPDATE
          SET name = EXCLUDED.name 
          RETURNING commodity_id ;`;
          const commodityQueryResult = await pool.query(commodityInsertQuery, [cmd_name]);
          commodityId = commodityQueryResult.rows[0].commodity_id;
          console.log(commodityQueryResult.rows[0].commodityId);
          return commodityId
        
}
module.exports = {insertIntoCommodity}