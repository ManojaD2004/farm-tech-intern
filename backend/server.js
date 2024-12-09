const express = require("express");
const cors = require("cors");
const { configDotenv } = require("dotenv");
const { state } = require("./district.js");
const { WhatsAppWebhook } = require("./whatsappWebhook.js");
const { MandiDatabase } = require("./__queriesClass__/db.js");
// const { inserMandiData } = require("./db.js");

async function main() {
  configDotenv({ path: "./.env.local" });
  const app = express();
  app.use(express.json());
  app.use(cors());

  // console.log(process.env.WEBHOOK_VERIFY_TOKEN);
  const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN, PORT, SUPABASE_LINK } =
    process.env;
  const waWebhook = new WhatsAppWebhook(GRAPH_API_TOKEN);
  let item = {};
  let mandiJSON;
  let District = "";
  for (let key in state.karnataka) {
    District += key + " " + state.karnataka[key] + "\n";
  }
  const MandiDB = new MandiDatabase(SUPABASE_LINK);
  await MandiDB.connectDb();

  app.post("/webhook", async (req, res) => {
    try {
      const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
      console.log(req.body.entry?.[0]?.changes[0]?.value?.messages);
      if (message?.type === "text") {
        const business_phone_number_id =
          req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;
        if (!item[message.from]) {
          item[message.from] = {
            mandi: {
              contact: {
                contactType: "phone no",
                contactDetail: "",
              },
              name: "",
              state: "Karanataka",
              district: "",
              cmd_name: "",
              cmd_category: 0.0,
              cmd_price: 0.0,
              flag: 0,
            },
          };
        }
        item[message.from].mandi.contact.contactDetail = message.from;
        if (item[message.from].mandi.flag === 0) {
          await waWebhook.sendMessage(
            message.from,
            business_phone_number_id,
            "Enter your Name",
            message.id
          );
        } else if (item[message.from].mandi.flag === 1) {
          await waWebhook.sendMessage(
            message.from,
            business_phone_number_id,
            "Greetings to" +
              " " +
              message.text.body +
              " " +
              " please enter your district to begin the next phase of the process." +
              "\n" +
              District,
            message.id
          );
        } else if (
          item[message.from].mandi.flag === 2 ||
          message.text.body === "Yes"
        ) {
          await waWebhook.sendMessage(
            message.from,
            business_phone_number_id,
            "Enter the commodity",
            message.id
          );
          // console.log(message?.interactive?.list_reply);
        } else if (item[message.from].mandi.flag === 3) {
          await waWebhook.sendMessage(
            message.from,
            business_phone_number_id,
            "Enter the" + " " + message.text.body + " " + "Grade(1,2,3)",
            message.id
          );
          // console.log(message?.interactive?.list_reply);
        } else if (item[message.from].mandi.flag === 4) {
          await waWebhook.sendMessage(
            message.from,
            business_phone_number_id,
            "Enter the" +
              " " +
              item[message.from].mandi.cmd_name +
              " " +
              "Price",
            message.id
          );
          // console.log(message?.interactive?.list_reply);
        } else if (
          item[message.from].mandi.flag === 5 ||
          (message.text.body === "Hi" &&
            item[message.from].mandi.name !== "" &&
            item[message.from].mandi.district !== "")
        ) {
          if (
            message.text.body === "Hi" &&
            item[message.from].mandi.name !== "" &&
            item[message.from].mandi.district !== ""
          ) {
            await waWebhook.sendMessage(
              message.from,
              business_phone_number_id,
              "Welcome back" + " " + item[message.from].mandi.name,
              message.id
            );
            // console.log(message?.interactive?.list_reply);
          }
          await waWebhook.sendMessage(
            message.from,
            business_phone_number_id,
            "Want to add more commodity",
            message.id
          );
          // console.log(message?.interactive?.list_reply);
        } else if (message.text.body === "No") {
          await waWebhook.sendMessage(
            message.from,
            business_phone_number_id,
            "Thank you For sharing",
            message.id
          );
          // console.log(message?.interactive?.list_reply);
        }

        // mark incoming message as read
        if (
          message?.from &&
          item[message.from].mandi.name === "" &&
          item[message.from].mandi.flag === 1
        ) {
          item[message.from].mandi.name = message.text.body;
          console.log(item[message.from].mandi.name);
        } else if (
          message?.from &&
          item[message.from].mandi.district === "" &&
          item[message.from].mandi.flag === 2
        ) {
          item[message.from].mandi.district =
            state.karnataka[message.text.body];
          console.log(item[message.from].mandi.state);
          console.log(item[message.from].mandi.district);
        } else if (message?.from && item[message.from].mandi.flag === 3) {
          item[message.from].mandi.cmd_name = message.text.body;
          console.log(item[message.from].mandi.cmd_name);
        } else if (message?.from && item[message.from].mandi.flag === 4) {
          item[message.from].mandi.cmd_category = Number(message.text.body);
          console.log(item[message.from].mandi.cmd_category);
        } else if (message?.from && item[message.from].mandi.flag === 5) {
          item[message.from].mandi.cmd_price = Number(message.text.body);
          mandiJSON = JSON.stringify(item[message.from]);
          // inserMandiData(item[message.from]);
          console.log(item[message.from].mandi.cmd_price);
          console.log(mandiJSON);
        }
        if (message.text.body === "Yes") {
          item[message.from].mandi.flag = 2;
        }
        item[message.from].mandi.flag++;
        console.log(item[message.from].mandi.flag);
      }

      // Logic
      res.sendStatus(200);
    } catch (error) {
      console.log(error);
      console.log("Error!");
    }
    // log incoming messages
  });

  app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // check the mode and token sent are correct
    if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
      // respond with 200 OK and challenge token from the request
      res.status(200).send(challenge);
      console.log("Webhook verified successfully!");
    } else {
      // respond with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  });

  app.get("/", (req, res) => {
    res.send(`<pre>Nothing to see here.
  Checkout README.md to start.</pre>`);
  });

  app.get("/hello", (req, res) => {
    console.log("Hit /hello");
    res.send(`Hello Tiger!`);
  });

  app.post("/create-user", async function (req, res) {
    try {
      console.log("Hit /create-user");
      const { name, stateName, districtName, contact } = req.body;
      const { contactType, contactDetail } = contact;
      const userExists = await MandiDB.getUserExist(contactDetail)
      if(userExists){
        const mandiId = await MandiDB.getMandiId(contactDetail)
        res.send({ mandiId: `${mandiId}` });
      }
      const stateId = await MandiDB.insertIntoStateMaster(stateName);
      const locationId = await MandiDB.insertIntoLocation(
        districtName,
        stateId
      );
      const mandiId = await MandiDB.insertIntoMandi(locationId, name);
      await MandiDB.insertIntoContact(mandiId, contactType, contactDetail);
      res.status(200).send({ mandiId: `${mandiId}` });
    } catch (error) {
      res.status(400).send(error);
      console.log(error);
    }
  });

  app.post("/insert-commodity", async function (req, res) {
    try {
      console.log("Hit /insert-commodity");
      const { categoryName, cmdName, gradeType, gradePrice, mandiId } =
        req.body;
      const categoryId = await MandiDB.insertIntoCategory(categoryName);
      const commodityId = await MandiDB.insertIntoCommodity(
        cmdName,
        categoryId
      );
      await MandiDB.insertIntoCommodityPrice(
        commodityId,
        mandiId,
        gradeType,
        gradePrice
      );
      res.status(200).json({ mssg: "inserted" });
    } catch (error) {
      res.status(400).send(error);
      console.log(error);
    }
  });

  app.post("/mandi-detail", async function (req, res) {
    const { contactDetail } = req.body;
    const userMandiIds = await MandiDB.getMandiIds(contactDetail);
    const userMandiNames = await MandiDB.getMandiNames(userMandiIds);
    res.json({ name: userMandiNames, id: userMandiIds });
  });

  app.post("/categories-commodities", async (req, res) => {
    try {
      console.log("Hit /categories-commodities");
      const { mandiId } = req.body;
      const data = await MandiDB.getCategoriesAndCommoditiesByMandiIds(mandiId);
      res.status(200).send(data);
    } catch (error) {
      res.status(400).send(error);
      console.log(error);
    }
  });

  app.post("/user", async function (req, res) {
    const { contactDetail } = req.body;
    const userExists = await MandiDB.getUserExist(contactDetail);
    res.send({ exists: `${userExists}` });
  });

  app.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`);
  });
}
main();
