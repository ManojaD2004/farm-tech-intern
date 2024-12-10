const { MandiDatabase } = require("./__queriesClass__/db.js");
const express = require("express");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());
const MandiDB = new MandiDatabase(
"your string "
);
MandiDB.connectDb();
app.post("/create-user", async function (req, res) {
  try {
    console.log("Hit /create-user");
    const { name, stateName, districtName, contact } = req.body;
    const { contactType, contactDetail } = contact;
    const userExists = await MandiDB.getUserExist(contactDetail);
    if (userExists) {
      const mandiId = await MandiDB.getMandiId(contactDetail);
      res.status(200).send({ mandiId: `${mandiId}` });
      return;
    }
    const stateId = await MandiDB.insertIntoStateMaster(stateName);
    const locationId = await MandiDB.insertIntoLocation(districtName, stateId);
    const mandiId = await MandiDB.insertIntoMandi(locationId, name);
    await MandiDB.insertIntoContact(mandiId, contactType, contactDetail);
    res.status(200).send({ mandiId: `${mandiId}` });
  } catch (error) {
    res.status(400).send(error);
    console.log(error);
  }
});
app.listen(5000, () => {
  console.log("server stared on port : http://localhost:5000");
});
