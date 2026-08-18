const cron = require("node-cron");
const { syncMedicines } = require("../services/syncService");

const startMedicineSyncJob = () => {
  // Har din raat 2 baje
  cron.schedule("0 2 * * *", async () => {
    console.log("Running scheduled medicine sync...");

    await syncMedicines();
  });
};

module.exports = {
  startMedicineSyncJob,
};