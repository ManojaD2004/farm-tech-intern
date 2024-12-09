const express = require("express");
const cors = require("cors");
const { configDotenv } = require("dotenv")


  configDotenv({ path: "./.env.local" });
  const app = express();
  app.use(express.json());
  app.use(cors());
app.get('/user-details', async function(res,req) {

}
)