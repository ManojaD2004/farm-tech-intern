const express = require("express");
const cors = require("cors");
const { configDotenv } = require("dotenv")
const {MandiDatabase} = require("./db")
  configDotenv({ path: "./.env.local" });
  const app = express();
  app.use(express.json());
  app.use(cors());
  const MandiDB = new MandiDatabase()
app.post('/create-user', async function(req,res) {
  const { name, stateName, districtName,contact} = req.body;
  const stateId = await MandiDB.insertIntoStateMaster(stateName)
  const locationId = await MandiDB.insertIntoLocation(districtName,stateId);
  const mandiId = await MandiDB.insertIntoMandi(locationId, name);
  const { contactType, contactDetail } = contact;
  await MandiDB.insertIntoContact(mandiId,contactType,contactDetail);
    
}
)

app.post('/insert-commodity', async function(req,res){
  const {categoryName,cmdName,gradeType,gradePrice,mandiId} = req.body
  const categoryId = await MandiDB.insertIntoCategory(categoryName);
  const commodityId = await MandiDB.insertIntoCommodity(cmdName, categoryId);
  await MandiDB.insertIntoCommodityPrice(commodityId, mandiId, gradeType, gradePrice);
})

app.get('/user', async function(req,res){

  
})