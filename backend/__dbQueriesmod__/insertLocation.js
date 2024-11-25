
async function insertIntoLocation(pool,district,state){
  let locationId;
const selectQuery =
          "SELECT location_id from location WHERE district = $1 and state = $2;";
        const selectQueryResult = await pool.query(selectQuery, [district, state]);
        if (selectQueryResult.rows.length === 0) {
          const locationInsertQuery =
            "INSERT INTO location (district,state) VALUES($1,$2) RETURNING location_id ; ";
          const queryResult = await pool.query(locationInsertQuery, [
            district,
            state,
          ]);
         locationId = queryResult.rows[0].location_id;
        } else {
          locationId = selectQueryResult.rows[0].location_id;
        }
        return locationId
}
module.exports = {insertIntoLocation}