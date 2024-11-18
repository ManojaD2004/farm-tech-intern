const {Pool}  = require('pg');
const connectionString = "postgresql://postgres.bpghpskockfbsxskqlfv:Rahulla2005!@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
const pool = new Pool({
    connectionString
});

const mandiData = {
    "mandi": {
      "phone_num": "+1-800-565-1234",
      "name": "john doe",
      "state": "Karnataka",
      "district": "Bgalkote",
      "cmd_name": "banana",
      "cmd_price": "129.50"
    }
  };
  let locationId;
  let commodityId;
  let mandiId
async function connectDb(){
    try{
        await pool.connect();
        console.log('Connected to Supabase :)');
       }
    catch(err){
console.error(err);
        }
}

async function inserMandiData(data){
    const { phone_num, name, state, district, cmd_name, cmd_price } = data.mandi;
    try{
        //Inserting into loction 
        const selectQuery = "SELECT location_id from location WHERE district = $1 and state = $2;"
        const selectQueryResult = await pool.query(selectQuery,[district,state]);
        if(selectQueryResult.rows.length === 0){
            const locationInsertQuery = "INSERT INTO location (district,state) VALUES($1,$2) RETURNING location_id ;  "
            const queryResult  = await pool.query(locationInsertQuery,[district,state]);
            locationId = queryResult.rows[0].location_id
        }
        else {
            locationId = selectQueryResult.rows[0].location_id;
        }
        
        //Inserting into Mstr_Mandi
        const mstrMandiInsertQuery = `
        INSERT INTO mstr_mandi (phone_number, location_id, name)
        VALUES($1, $2, $3)
        ON CONFLICT(phone_number) DO NOTHING
        RETURNING mandi_id;
    `;
    
    const mandiQueryResult = await pool.query(mstrMandiInsertQuery, [phone_num, locationId, name]);
    
    if (mandiQueryResult.rows.length > 0) {
        mandiId = mandiQueryResult.rows[0].mandi_id;
    } else {
        const selectMandiIdQuery = "SELECT mandi_id FROM mstr_mandi WHERE phone_number = $1;";
        const mandiSelectQueryResult = await pool.query(selectMandiIdQuery, [phone_num]);
        mandiId = mandiSelectQueryResult.rows[0].mandi_id;
    }
    
    console.log("Mandi ID:", mandiId);
    
        //Inserting into commodity 
        const commodityInsertQuery = "INSERT INTO commodity (name) VALUES($1) RETURNING commodity_id ;"
        const commodityQueryResult = await pool.query(commodityInsertQuery,[cmd_name]);
        commodityId = commodityQueryResult.rows[0].commodity_id;
        console.log(commodityQueryResult.rows[0]);
        //Inserting into commodity_price
        const commodityPriceInsertQuery = "INSERT INTO commodity_price (commodity_id,location_id,mandi_id,grade_price) VALUES($1,$2,$3,$4) RETURNING * ;"
        const commodityPriceQueryResult = await pool.query(commodityPriceInsertQuery,[commodityId,locationId,mandiId,cmd_price])
        console.log(commodityPriceQueryResult.rows[0]);
       }
    catch(err){
        console.error(err);
    }
}
connectDb();
inserMandiData(mandiData);
(console.log("Mandi Data inserted successfully :)"));