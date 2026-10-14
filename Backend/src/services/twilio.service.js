const twilio = require("twilio");

let client;

function isTwilioConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID
  );
}

function getVerifyService() {
  if (!isTwilioConfigured()) {
    throw new Error("Twilio Verify is not configured");
  }

  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  return client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID);
}

async function sendVerificationCode(phoneNumber) {
  await getVerifyService().verifications.create({
    to: phoneNumber,
    channel: "sms",
  });
}

async function verifyCode(phoneNumber, code) {
  const verification = await getVerifyService().verificationChecks.create({
    to: phoneNumber,
    code,
  });

  return verification.status === "approved";
}

module.exports = {
  isTwilioConfigured,
  sendVerificationCode,
  verifyCode,
};