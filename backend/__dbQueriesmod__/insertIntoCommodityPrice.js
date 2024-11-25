async function insertIntoCommodityPrice(pool,commodityId,locationId,mandiId,cmd_price){
try{
    const commodityPriceInsertQuery =
    "INSERT INTO commodity_price (commodity_id,location_id,mandi_id,grade_price) VALUES($1,$2,$3,$4) RETURNING * ;";
    const commodityPriceQueryResult = await pool.query(
    commodityPriceInsertQuery,
    [commodityId, locationId, mandiId, cmd_price]
    );
    console.log(commodityPriceQueryResult.rows[0]);
}
catch(err){
    console.error(err)
}
}
module.exports = {insertIntoCommodityPrice}