const readline = require("readline");
const yargs = require("yargs");
const path = require("path");

const { handleNew, handleList, handleDone, handleHelp, handleVersion, handleDelete } = require("./handlers");
//////

require("dotenv").config({
  override: true,
  path: path.join(__dirname, "development.env"),
});
const { Pool, Client } = require("pg");

const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT,
});

(async () => {
  const client = await pool.connect();
  const inputName = "Adam111";
  try {
    const { rows } = await client.query("select * from users");
    console.log(rows);
    const userData = rows.find((el) => el.name === inputName);
    if (userData) {
      console.log(`Welcome ${userData.name} your ID is ${userData.id}`);
    } else {
      console.log("failed to log in");
    }
  } catch (error) {
    console.error(error);
  } finally {
    client.release();
  }
})();
///////

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
let repeat = true;

function promptUser() {
  rl.question("Enter command:", (command) => {
    const argv = yargs.parse(command);
    const commandName = argv?._[0]?.toLowerCase();
    const parameter = argv?._[1];
    console.log(commandName, parameter);

    // Commands usage
    if (commandName === "new") {
      handleNew();
    }
    if (commandName === "list") {
    }
    if (commandName === "done") {
    }
    if (commandName === "delete") {
    }
    if (commandName === "help") {
    }
    if (commandName === "version") {
    }

    // If the repeat state haven't changed, loop again
    if (repeat) promptUser();
  });
}
// promptUser();
