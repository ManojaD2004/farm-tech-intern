const {pool,connectDb} = require("./__dbQueriesmod__/connectdb")
const {insertIntoLocation} = require("./__dbQueriesmod__/insertLocation")
const {insertIntoMandi} = require("./__dbQueriesmod__/insertIntoMandi")
const {insertIntoCommodity} = require("./__dbQueriesmod__/insertIntoCommodity")
const {insertIntoCommdityPrice} = require("./__dbQueriesmod__/insertIntoCommodityPrice")
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
   locationId = await insertIntoLocation(pool,district,state)

   mandiId = await insertIntoMandi(pool,phone_num,locationId,name)

    commodityId = await insertIntoCommodity(pool,cmd_name)
  
    await insertIntoCommdityPrice(pool,commodityId,locationId,mandiId,cmd_price)
  } catch (err) {
    console.error(err.message);
  }
}
connectDb()
console.log("Connected Started!");
module.exports = { inserMandiData };
