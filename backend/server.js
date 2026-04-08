import app from "./src/app.js";
import startCronJobs from './src/configs/cron.js';

startCronJobs();
const port = process.env.PORT || 5000
app.listen(port, () => {
    console.log("Server is running!");
    // Environment
console.log("ENVIRONMENT :",process.env.NODE_ENV)
})