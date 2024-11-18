/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import express from "express";
import axios from "axios";
import cors from "cors";
import { configDotenv } from "dotenv";
import { state } from "./District.js";

configDotenv();
const app = express();
app.use(express.json());
app.use(cors());

const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN, PORT } = process.env;
let item = {};
let mandiJSON;
let District = "";
for (let key in state.karnataka) {
  District += key + " " + state.karnataka[key] + "\n";
}

app.post("/webhook", async (req, res) => {
  try {
    // console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));

    // check if the webhook request contains a message
    // details on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
    const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
    console.log(req.body.entry?.[0]?.changes[0]?.value?.messages);
    // check if the incoming message contains text
    if (message?.type === "text" || message?.type === "interactive") {
      // extract the business number to send the reply from it
      // mandi["phone_num"] = message.from;
      const business_phone_number_id =
        req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;
      if (!item[message.from]) {
        item[message.from] = {
          mandi: {
            phone_num: "",
            name: "",
            state: "Karanataka",
            district: "",
            cmd_name: "",
            cmd_price: 0.0,
            flag: 0
          }
        };
      }
      item[message.from].mandi.phone_num = message.from;
      // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
      if (item[message.from].mandi.flag === 0) {
        await axios({
          method: "POST",
          url: `https://graph.facebook.com/v21.0/${business_phone_number_id}/messages`,
          headers: {
            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          },
          data: {
            messaging_product: "whatsapp",
            to: message.from,
            text: {
              body:
                "Enter your Name"
            },
            context: {
              message_id: message.id, // shows the message as a reply to the original user message
            },
          },
        });
      }
      else if (item[message.from].mandi.flag === 1) {
        await axios({
          method: "POST",
          url: `https://graph.facebook.com/v21.0/${business_phone_number_id}/messages`,
          headers: {
            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          },
          data: {
            messaging_product: "whatsapp",
            to: message.from,
            text: { body: "Greetings to" + " " + message.text.body + " " + " please enter your district to begin the next phase of the process." + "\n" + District },
            context: {
              message_id: message.id, // shows the message as a reply to the original user message
            },
          },
        });
      }
      else if (item[message.from].mandi.flag === 2 || message.text.body === "Yes") {
        console.log(message?.interactive?.list_reply);
        await axios({
          method: "POST",
          url: `https://graph.facebook.com/v21.0/${business_phone_number_id}/messages`,
          headers: {
            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          },
          data: {
            messaging_product: "whatsapp",
            to: message.from,
            text: { body: "Enter the commodity" },
            context: {
              message_id: message.id, // shows the message as pa reply to the original user message
            },
          },
        });
      }
      else if (item[message.from].mandi.flag === 3) {
        console.log(message?.interactive?.list_reply);
        await axios({
          method: "POST",
          url: `https://graph.facebook.com/v21.0/${business_phone_number_id}/messages`,
          headers: {
            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          },
          data: {
            messaging_product: "whatsapp",
            to: message.from,
            text: { body: "Enter the" + " " + message.text.body + " " + "Price" },
            context: {
              message_id: message.id, // shows the message as pa reply to the original user message
            },
          },
        });

      }
      else if (item[message.from].mandi.flag === 4 || (message.text.body === "Hi" && item[message.from].mandi.name !== "" && item[message.from].mandi.district !== "")) {
        if (message.text.body === "Hi" && item[message.from].mandi.name !== "" && item[message.from].mandi.district !== "") {
          console.log(message?.interactive?.list_reply);
          await axios({
            method: "POST",
            url: `https://graph.facebook.com/v21.0/${business_phone_number_id}/messages`,
            headers: {
              Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: {
              messaging_product: "whatsapp",
              to: message.from,
              text: { body: "Welcome back" + " " + item[message.from].mandi.name },
              context: {
                message_id: message.id, // shows the message as pa reply to the original user message
              },
            },
          });
        }
        console.log(message?.interactive?.list_reply);
        await axios({
          method: "POST",
          url: `https://graph.facebook.com/v21.0/${business_phone_number_id}/messages`,
          headers: {
            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          },
          data: {
            messaging_product: "whatsapp",
            to: message.from,
            text: { body: "Want to add more commodity" },
            context: {
              message_id: message.id, // shows the message as pa reply to the original user message
            },
          },
        });
      }
      else if (message.text.body === "No") {
        console.log(message?.interactive?.list_reply);
        await axios({
          method: "POST",
          url: `https://graph.facebook.com/v21.0/${business_phone_number_id}/messages`,
          headers: {
            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          },
          data: {
            messaging_product: "whatsapp",
            to: message.from,
            text: { body: "Thank you For sharing" },
            context: {
              message_id: message.id, // shows the message as pa reply to the original user message
            },
          },
        });
      }

      // mark incoming message as read
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/v21.0/${business_phone_number_id}/messages`,
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          status: "read",
          message_id: message.id,
        },
      });
      if (message?.from && item[message.from].mandi.name === "" && item[message.from].mandi.flag === 1) {
        item[message.from].mandi.name = message.text.body;
        console.log(item[message.from].mandi.name);
      }
      else if (message?.from && item[message.from].mandi.district === "" && item[message.from].mandi.flag === 2) {
        item[message.from].mandi.district = state.karnataka[message.text.body];
        console.log(item[message.from].mandi.state);
        console.log(item[message.from].mandi.district);
      }
      else if (message?.from && item[message.from].mandi.flag === 3) {
        item[message.from].mandi.cmd_name = message.text.body;
        console.log(item[message.from].mandi.cmd_name);
      }
      else if (message?.from && item[message.from].mandi.flag === 4) {
        item[message.from].mandi.cmd_price = message.text.body;
        mandiJSON = JSON.stringify(item[message.from]);
        console.log(item[message.from].mandi.cmd_price);
        console.log(mandiJSON);
      }
      if (message.text.body === "Yes") {
        item[message.from].mandi.flag = 2;
      }
      if (message.text.body === "Hi" && item[message.from].mandi.name !== "" && item[message.from].mandi.district !== "") {
        item[message.from].mandi.flag = 3;
      }
      item[message.from].mandi.flag++;
    }


    // Logic 
    res.sendStatus(200);

  } catch (error) {
    console.log(error);
    console.log("Error!");
  }
  // log incoming messages
});

// accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
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

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
