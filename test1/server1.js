import { Pool } from 'pg';

const mainDbConnectionString = process.env.MAIN_DB_CONNECTION_STRING;
const reportDbConnectionString = process.env.REPORT_DB_CONNECTION_STRING;

const mainDbPool = new Pool({
  connectionString: mainDbConnectionString,
});

const reportDbPool = new Pool({
  connectionString: reportDbConnectionString,
});

async function fetchData() {
  try {
    console.log("Fetching data from the main database...");

    const query = `
      SELECT 
          M.Mandi_id, 
          M.Location_id, 
          L.district AS location,
          M.name AS mandi_name, 
          C.name AS commodity_name, 
          C.category AS commodity_category, 
          CP.Price_id, 
          CP.Commodity_id, 
          CP.Mandi_id AS mandi_price_id, 
          CP.Location_id AS price_location_id,
          L.state AS location_state
      FROM 
          Mstr_mandir M
      JOIN 
          location L ON M.Location_id = L.Location_id
      JOIN 
          commodity_price CP ON M.Mandi_id = CP.Mandi_id
      JOIN 
          commodity C ON CP.Commodity_id = C.Commodity_id;
    `;

    const result = await mainDbPool.query(query);

    console.log("Data fetched successfully:");
    result.rows.forEach(row => {
      console.log(row);
    });

  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function updateAverages() {
  try {
    console.log("Starting to update averages...");

    const insertAvgCommodityPriceQuery = `
      INSERT INTO avg_commodity_price (Commodity_id, Average_Price, Updated_at)
      SELECT 
          Commodity_id, 
          AVG("Grade_price") AS Average_Price, 
          NOW()
      FROM commodity_price
      GROUP BY Commodity_id
      RETURNING Commodity_id, AVG("Grade_price") AS Average_Price;
    `;
    const commodityQueryResult = await reportDbPool.query(insertAvgCommodityPriceQuery);
    console.log('Avg Commodity Price Inserted:');
    console.log(`Commodity ID: ${commodityQueryResult.rows[0].commodity_id}`);
    console.log(`Average Price: ${commodityQueryResult.rows[0].average_price}`);

    const insertAvgMandiPriceQuery = `
      INSERT INTO avg_mandi_price (Mandi_id, Average_Price, Updated_at)
      SELECT 
          Mandi_id, 
          AVG("Grade_price") AS Average_Price, 
          NOW()
      FROM commodity_price
      GROUP BY Mandi_id
      RETURNING Mandi_id, AVG("Grade_price") AS Average_Price;
    `;
    const mandiQueryResult = await reportDbPool.query(insertAvgMandiPriceQuery);
    console.log('Avg Mandi Price Inserted:');
    console.log(`Mandi ID: ${mandiQueryResult.rows[0].mandi_id}`);
    console.log(`Average Price: ${mandiQueryResult.rows[0].average_price}`);

    const insertAvgCommodityPricePerMandiQuery = `
      INSERT INTO avg_commodity_price_per_mandi (Mandi_id, Commodity_id, Average_Price, Updated_at)
      SELECT 
          Mandi_id, 
          Commodity_id, 
          AVG("Grade_price") AS Average_Price, 
          NOW()
      FROM commodity_price
      GROUP BY Mandi_id, Commodity_id
      RETURNING Mandi_id, Commodity_id, AVG("Grade_price") AS Average_Price;
    `;
    const commodityPerMandiQueryResult = await reportDbPool.query(insertAvgCommodityPricePerMandiQuery);
    console.log('Avg Commodity Price Per Mandi Inserted:');
    console.log(`Mandi ID: ${commodityPerMandiQueryResult.rows[0].mandi_id}`);
    console.log(`Commodity ID: ${commodityPerMandiQueryResult.rows[0].commodity_id}`);
    console.log(`Average Price: ${commodityPerMandiQueryResult.rows[0].average_price}`);

    // 4. Insert Avg Mandi Price In Location
    const insertAvgMandiPriceInLocationQuery = `
      INSERT INTO avg_mandi_price_in_location (Location_id, Mandi_id, Average_Price, Updated_at)
      SELECT 
          L.Location_id, 
          M.Mandi_id,
          AVG(CP."Grade_price") AS Average_Price, 
          NOW()
      FROM commodity_price CP
      JOIN Mstr_mandir M ON M.Mandi_id = CP.Mandi_id
      JOIN location L ON L.Location_id = M.Location_id
      GROUP BY L.Location_id, M.Mandi_id
      RETURNING Location_id, Mandi_id, AVG(CP."Grade_price") AS Average_Price;
    `;
    const mandiLocationQueryResult = await reportDbPool.query(insertAvgMandiPriceInLocationQuery);
    console.log('Avg Mandi Price In Location Inserted:');
    console.log(`Location ID: ${mandiLocationQueryResult.rows[0].location_id}`);
    console.log(`Mandi ID: ${mandiLocationQueryResult.rows[0].mandi_id}`);
    console.log(`Average Price: ${mandiLocationQueryResult.rows[0].average_price}`);
    
    console.log("Averages updated successfully!");

  } catch (error) {
    console.error('Error updating averages:', error);
  }
}

async function main() {
  await fetchData();
  await updateAverages();
}

main();
