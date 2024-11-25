async function insertIntoMandi(pool,phone_num,locationId,name){
    let  mandiId      
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
        return mandiId
}
module.exports = {insertIntoMandi}