const axios = require("axios");
const fs = require("fs/promises");
require("dotenv").config();

const checkAuthorizedSender = (sender) => {
  const authorizedSender = process.env.PHONES.split(",");
  let auth = false;
  authorizedSender.forEach((phone) => {
    if (sender == phone) {
      auth = true;
    }
  });
  return auth;
};

const generalCommands = (message) => {
  if (message == "בטל") {
    return true;
  }
  return false;
};

//const sendWhatsappMsg = async (message, phone) => {
const sendWhatsappMsg = async (message, phone) => {
  const data = {
    chatId: phone,
    message,
    linkPreview: false,
  };
  const response = await axios.post(
    `https://api.greenapi.com/waInstance${process.env.ID_INSTANCE}/sendMessage/${process.env.API_TOKEN_INSTANCE}`,
    data
  );
  console.log(response.data);
};

const createQrCodeLink = () => {
  return `https://qr.green-api.com/waInstance${process.env.ID_INSTANCE}/${process.env.API_TOKEN_INSTANCE}`;
};

const sendNewQrCodeViaSms = async () => {
  const line1 = "⚠️⚠️⚠️\n";
  const line2 =
    "חיבור חשבון הווצאפ שלך התנתק מ GreenAPI, עליך לתקן זאת באופן מיידי!!!\n\n";
  const line3 = "קישור להתחברות -\n";
  const QrCodeUrl = createQrCodeLink();
  const line5 = "\n\n❗❗❗\n";
  const line6 = "אל תשתף קישור זה עם אף אחד!!!";

  const message = line1 + line2 + line3 + QrCodeUrl + line5 + line6;
  const sendTo = process.env.ADMIN_PHONE;
  await sendSms(message, sendTo);
};

const sendSms = async (message, phone) => {
  headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.SMS_TOKEN}`,
  };
  data = {
    sms: {
      user: {
        username: process.env.SMS_USERNAME,
      },
      source: process.env.SMS_SOURCE,
      destinations: {
        phone: [
          {
            _: phone,
          },
        ],
      },
      message: message,
    },
  };

  try {
    const response = await axios.post(`https://019sms.co.il/api`, data, {
      headers: headers,
    });

    console.log(response.data);
  } catch (error) {
    console.error("Error sending text message:", error.message);
  }
};

const countObjectsInJSONFile = () => {
  try {
    // Read the content of the JSON file
    const fileContent = fs.readFileSync("news.json", "utf-8");

    // Parse the JSON content as an array
    const jsonArray = JSON.parse(fileContent);

    // Return the length of the array
    return jsonArray.length;
  } catch (error) {
    // Handle errors, such as file not found or invalid JSON format
    console.log(error);
    console.error("Error reading or parsing the JSON file:", error.message);
    return -1; // Return -1 to indicate an error
  }
};

const calculateMinutesDifference = (timestamp1, timestamp2) => {
  const differenceInSeconds = Math.abs(timestamp1 - timestamp2);
  const minutes = Math.floor(differenceInSeconds / 60);
  return minutes;
};

const findStageBySender = async (sender) => {
  try {
    // Read the content of the JSON file
    const fileContent = await fs.readFile("stage.json", "utf-8");
    const stages = JSON.parse(fileContent);

    // Search for the stage with the given chatId
    const foundStage = stages.find((stage) => stage.sender === sender);

    // Return the result
    return foundStage || false;
  } catch (error) {
    // Handle errors, such as file not found or invalid JSON format
    console.error("Error reading or parsing the JSON file:", error.message);
    return false; // Return false to indicate an error
  }
};

const resetStage = async (sender, timestamp) => {
  try {
    // Read the content of the JSON file
    const fileContent = await fs.readFile("stage.json", "utf-8");
    let stages = JSON.parse(fileContent);

    // Find the index of the stage with the specified chatId
    const indexToUpdate = stages.findIndex((stage) => stage.sender === sender);

    if (indexToUpdate !== -1) {
      // Replace the entire stage object with a new one
      stages[indexToUpdate] = {
        sender: sender,
        stage: 0,
        timestamp: timestamp,
        data: {},
        nextStage: "welcomeMessage",
        newsId: 0,
      };

      // Write the updated stages back to the file
      await fs.writeFile(
        "stage.json",
        JSON.stringify(stages, null, 2),
        "utf-8"
      );

      console.log(
        `Stage with sender ${sender} reset successfully with new timestamp ${timestamp}.`
      );
      return true;
    } else {
      console.log(`Stage with chatId ${sender} not found.`);
      return false;
    }
  } catch (error) {
    // Handle errors, such as file not found or invalid JSON format
    console.error("Error reading or updating the JSON file:", error.message);
    return false;
  }
};

const updateStageStep = async (sender, updateData) => {
  try {
    // Read the content of the JSON file
    const fileContent = await fs.readFile("stage.json", "utf-8");
    let stages = JSON.parse(fileContent);

    // Find the index of the stage with the specified chatId
    const indexToUpdate = stages.findIndex((stage) => stage.sender === sender);

    if (indexToUpdate !== -1) {
      for (const key in updateData) {
        if (updateData.hasOwnProperty(key)) {
          stages[indexToUpdate][key] = updateData[key];
        }
      }

      // Write the updated stages back to the file
      await fs.writeFile("stage.json", JSON.stringify(stages, null, 2));

      console.log(
        `Stage with chatId ${sender} reset successfully with new timestamp ${updateData.timestamp}.`
      );
      return true;
    } else {
      console.log(`Stage with chatId ${sender} not found.`);
      return false;
    }
  } catch (error) {
    // Handle errors, such as file not found or invalid JSON format
    console.error("Error reading or updating the JSON file:", error.message);
    return false;
  }
};

const stageWelcomeMessage = async (stage) => {
  const dataToUpdate = {
    timestamp: stage.timestamp,
    nextStage: "pickAction",
  };
  await updateStageStep(stage.sender, dataToUpdate);
  await sendWhatsappMsg(
    "*איזה פעולה תרצה לבצע?*\n\n1. פרסום ידיעה חדשה\n2. עריכת ידיעה\n3. מחיקת ידיעה",
    stage.sender
  );
};

const stageSelection = async (stage) => {
  console.log(`selection stage: ${JSON.stringify(stage, null, 2)}`);
  switch (stage.nextStage) {
    case "welcomeMessage":
      console.log("123");
      await stageWelcomeMessage(stage);
      break;
    case "pickAction":
      // code block
      break;
    default:
    // code block
  }
};

const createNewStage = async (sender, timestamp) => {
  try {
    // Read the existing content of the JSON file
    const fileContent = await fs.readFile("stage.json", "utf-8");
    let stages = JSON.parse(fileContent);

    // Create a new stage object
    const newStage = {
      sender: sender,
      stage: 0,
      timestamp: timestamp,
      data: {},
      nextStage: "welcomeMessage",
      newsId: 0,
    };

    // Add the new stage to the array
    stages.push(newStage);

    // Write the updated stages back to the file
    await fs.writeFile("stage.json", JSON.stringify(stages, null, 2), "utf-8");

    console.log(
      `New stage added with chatId ${sender} and timestamp ${timestamp}.`
    );
    return true;
  } catch (error) {
    // Handle errors, such as file not found or invalid JSON format
    console.error("Error reading or updating the JSON file:", error.message);
    return false;
  }
};

const incomingMessageReceived = async (incomingMessage) => {
  const sender = incomingMessage.senderData.sender;
  const typeMessage = incomingMessage.messageData.typeMessage;
  const textMessage = incomingMessage.messageData.textMessageData.textMessage;
  const timestamp = incomingMessage.timestamp;
  if (checkAuthorizedSender(sender)) {
    if (typeMessage == "textMessage" && generalCommands(textMessage)) {
    } else {
      let stage = await findStageBySender(sender);
      if (stage) {
        const minutesDifference = calculateMinutesDifference(
          stage.timestamp,
          timestamp
        );
        if (minutesDifference > process.env.MINUTES_TO_RESET) {
          await updateStageStep(sender, {
            timestamp: timestamp,
            nextStage: "welcomeMessage",
          });
        }
      } else {
        await createNewStage(sender, timestamp);
      }
      stage = await findStageBySender(sender);
      console.log(`the stage that found: ${JSON.stringify(stage, null, 2)}`);
      await stageSelection(stage);
    }
  } else {
    console.log("unauthorized");
  }
};

const stateInstanceChanged = async (incomingMessage) => {
  if (incomingMessage.stateInstance == "notAuthorized") {
    sendNewQrCodeViaSms();
  }
};

module.exports = {
  checkAuthorizedSender,
  generalCommands,
  sendNewQrCodeViaSms,
  incomingMessageReceived,
  stateInstanceChanged,
};
