const readline = require("readline");
const yargs = require("yargs");
const { databaseConnect } = require("./databaseConnect");
const {
  handleNew,
  handleList,
  handleDone,
  handleHelp,
  handleVersion,
  handleDelete,
  handleEnd,
} = require("./handlers");
const askQuestion = require("./askQuestion");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
let repeat = true;


// class App(){
//   let client;
//   let userData;
//   let loggedStatus ;
//   let programRun;

//   function init(){
//     this.client = await databaseConnect();
//     this.loggedStatus = false
//     this.programRun = true
//   }
// }

async function app() {
  const client = await databaseConnect();
  const { rows: users } = await client.query("select * from users");
  let userData;
  let loggedStatus = false;
  let programRun = true;
  console.log(users);

  console.log("Welcome in the TODO List app");
  console.log("To start, you have to log in to your todo list or create a new one");

  // Logging Status
  while (!loggedStatus) {
    const loginAnswer = await askQuestion("What do you want to do? (login/create)");
    const argv = yargs.parse(loginAnswer);
    const action = argv?._[0].toLowerCase();

    if (action === "login") {
      let nameData;
      while (!loggedStatus) {
        const nameAnswer = await askQuestion("Enter your name");
        const argv = yargs.parse(nameAnswer);
        const name = argv?._[0];
        nameData = users.find((el) => el.name === name);
        console.log(nameData);
        if (!name || !nameData) {
          console.log("Couldn't find the user");
          continue;
        }

        loggedStatus = true;
      }
      loggedStatus = true;
      console.log("Successfully logged in");
      userData = nameData;
      continue;
    }

    if (action === "create") {
      while (!loggedStatus) {
        const newNameAnswer = await askQuestion("Enter new name:");
        const argv = yargs.parse(newNameAnswer);
        const newName = argv?._[0]?.toLowerCase();
        if (!newName) {
          console.log("Wrong input");
          return;
        }

        const boolAnswer = await askQuestion(
          `Are you sure you want to create a new user with name ${newName} (y/n)`
        );
        const argv2 = yargs.parse(boolAnswer);
        const bool = argv2?._[0]?.toLowerCase();
        if (bool === "y") {
          if (users.find((el) => el.name === newName)) {
            console.log("User already exist");
            return;
          }
          try {
            const x = await client.query(`INSERTF INTO users (name) VALUES ('${newName}')`);
          } catch (error) {
            console.log("Database query error, try again");
            continue;
          }
          loggedStatus = true;
          console.log(`User ${newName} has been created`);
          return;
        }
        return;
      }
    }
    console.log("Wrong input");
  }
  // main functionality
  console.log(`\n${userData.name}, now you can menage your todo list`);
  console.log('TIP: Enter "helpMe" for a command list');
  while (programRun) {
    const commandAnswer = await askQuestion("Enter command:");
    const argv = yargs.parse(commandAnswer);
    const commandName = argv?._[0]?.toLowerCase();
    const parameter = argv?._[1];
    // console.log(commandName, parameter);

    // Commands usage
    if (commandName === "new") {
      handleNew();
    }
    if (commandName === "list") {
      handleList(parameter);
    }
    if (commandName === "done") {
      handleDone(parameter);
    }
    if (commandName === "delete") {
      handleDelete(parameter);
    }
    if (commandName === "helpMe") {
      handleHelp();
    }
    if (commandName === "version") {
      handleVersion();
    }
    if (commandName === "end") {
      handleEnd();
      programRun = false;
    }
  }
}

app();

