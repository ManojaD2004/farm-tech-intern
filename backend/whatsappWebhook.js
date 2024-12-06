const axios = require("axios");

class WhatsAppWebhook {
  constructor(Token) {
    this.Token = Token;
  }
  async sendMessage(phone_num, business_phone_number_id, Text, msgId) {
    await axios({
      method: "POST",
      url: `https://graph.facebook.com/v21.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${this.Token}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: phone_num,
        text: {
          body: Text,
        },
        context: {
          message_id: msgId, // shows the message as a reply to the original user message
        },
      },
    });
    await this.markMsgRead(business_phone_number_id, msgId);
  }
  async markMsgRead(business_phone_number_id, msgId) {
    await axios({
      method: "POST",
      url: `https://graph.facebook.com/v21.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${this.Token}`,
      },
      data: {
        messaging_product: "whatsapp",
        status: "read",
        message_id: msgId,
      },
    });
  }
}

module.exports = { WhatsAppWebhook }