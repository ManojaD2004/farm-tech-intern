const express = require("express");
const cors = require("cors");
const { configDotenv } = require("dotenv")
const {MandiDatabase} = require("./db");
const { default: axios } = require("axios");
  configDotenv({ path: "./.env.local" });
  const app = express();
  app.use(express.json());
  app.use(cors());
  const MandiDB = new MandiDatabase()
  MandiDB.connectDb()
app.post('/create-user', async function(req,res) {
  const { name, stateName, districtName,contact} = req.body;
  const stateId = await MandiDB.insertIntoStateMaster(stateName)
  const locationId = await MandiDB.insertIntoLocation(districtName,stateId);
  const mandiId = await MandiDB.insertIntoMandi(locationId, name);
  const { contactType, contactDetail } = contact;
  await MandiDB.insertIntoContact(mandiId,contactType,contactDetail);
  res.send({mandiId : `${mandiId}`});
    
}
)

app.post('/insert-commodity', async function(req,res){
  const {categoryName,cmdName,gradeType,gradePrice,mandiId} = req.body
  const categoryId = await MandiDB.insertIntoCategory(categoryName);
  const commodityId = await MandiDB.insertIntoCommodity(cmdName, categoryId);
  await MandiDB.insertIntoCommodityPrice(commodityId, mandiId, gradeType, gradePrice);
  res.json({mssg : "inserted"})
})

app.get('/mandi-detail',async function(req,res){
  const { contactDetail } = req.body;
 const userMandiIds = await MandiDB.getMandiIds(contactDetail)
 const userMandiNames = await MandiDB.getMandiNames(userMandiIds)
 res.json({name :userMandiNames,id : userMandiIds})
})

app.get('/categories-commodities', async (req, res) => {
  
    const { contactDetail } = req.body;
    const mandiIds = await MandiDB.getMandiIds(contactDetail);
    console.log(mandiIds)
    const data = await MandiDB.getCategoriesAndCommoditiesByMandiIds(mandiIds);
    res.json(data,);
 
});


app.get('/hello' , function(req,res){
  res.send('Hello Champ')
})

app.get('/user', async function(req,res){
const {contactDetail} = req.body 
const userExists = await MandiDB.getUserExist(contactDetail)
res.send({exists : `${userExists}`})
})
app.post('/gemini', async (req, res) => {
  const { input } = req.body;
  console.log(input)
const Prompt ="Respond with only one word: Is the given input a fruit or a vegetable? ";

  try {
    const geminiApiResponse = await Gemini(Prompt,input);

    res.status(200).json({
      input,
      aiResponse: geminiApiResponse,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error processing the request' });
  }
});
app.listen(5000, () => {
 console.log('server started on http://localhost:5000')
})
async function Gemini(Prompt , input) {
  const requestBody = {
    contents: [{ parts: [{ text: Prompt + input }] }],
  };
    const response = await axios({
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyBdvJeSPTQG1NCk-WjkKcYssahXc41RtUE`,
      method: "post",
      data: {
        contents: [{ parts: [{ text: Prompt + input }] }],
      },
    }
  )

   
  const aiResponse = response.data.candidates[0].content.parts[0].text;
  console.log(aiResponse)
  return aiResponse
}