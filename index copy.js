const express = require("express");
const functions = require("./functions");

const app = express();

app.use(express.json());

app.post("/incomingMessages", async (req, res) => {
  try {
    const incomingMessage = req.body;

    // console.log(incomingMessage);
    const typeWebhook = incomingMessage.typeWebhook;
    if (typeWebhook == "incomingMessageReceived") {
      functions.incomingMessageReceived(incomingMessage);
    } else if (typeWebhook == "stateInstanceChanged") {
      functions.stateInstanceChanged(incomingMessage);
    } else {
      console.log("its dont working!");
    }
  } catch (error) {
    console.log(error);
  }
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
