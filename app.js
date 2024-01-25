const readline = require("readline");
const yargs = require("yargs");
const { databaseConnect } = require("./databaseConnect");
const { handleNew, handleList, handleDone, handleHelp, handleVersion, handleDelete } = require("./handlers");

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
async function app() {
  const client = await databaseConnect();
  const { rows } = await client.query("select * from users");
  let userId;
  let loggedStatus = false;
  console.log(rows);

  while (!loggedStatus) {
    rl.question("Enter your nickname:", (nickname) => {
      const argv = yargs.parse(command);
      const nickname = argv?._[0]?.toLowerCase();
      const nicknameData = rows.find((el) => el.name === nickname);
      if (!nickname || !nicknameData) {
        console.log("Couldn't find the user");
        rl.question(`Do you want to create ${nickname} user? (y/n)`, (bool) => {
          if (bool?.toString() === "y") {
            // Add user to database
          }
        });
        return;
      }

      console.log("Successfully logged in");
      loggedStatus = true;
      userId = nicknameData.id;
    });
  }
}
