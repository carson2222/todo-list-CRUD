const { databaseConnect } = require("./databaseConnect");
// const {
//   handleNew,
//   handleList,
//   handleDone,
//   handleHelp,
//   handleVersion,
//   handleDelete,
//   handleEnd,
// } = require("./handlers");
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const yargs = require("yargs");

class App {
  constructor() {
    this.client;
    this.users;
    this.userData;
    this.loggedStatus = false;
    this.programRun = true;
    this.priorityTypes = ["a", "b", "c", "d", "e"];
    this.firstUse = true;
  }

  async init() {
    try {
      this.client = await databaseConnect();
      const { rows } = await this.client.query(`SELECT * FROM users`);
      this.users = rows;

      console.log("🥰😘🥰------------------------🥰😘🥰");
      console.log("Welcome in the TODO List app");
      console.log("To start, you have to log in to your todo list or create a new one");
      this.auth();
    } catch (error) {
      console.error(error);
    }
  }

  async auth() {
    try {
      const [action] = await this.askQuestion("What do you want to do? (login/create)");

      // LOGIN
      if (action === "login") {
        return this.logIn();
      }

      // CREATE
      if (action === "create") {
        return this.register();
      }
    } catch (error) {
      console.error(error);
    }
  }

  async logIn() {
    const [name] = await this.askQuestion("Enter your name");
    if (!name) {
      console.log("Input can't be empty");
      return this.logIn();
    }
    await this.updateUsers();
    this.userData = this.users.filter((el) => el.name === name)?.[0];

    if (!this.userData) {
      console.log("Couldn't find the user");
      return this.logIn();
    }

    this.loggedStatus = true;
    console.log("Successfully logged in");
    return this.todoManage();
  }
  async register() {
    try {
      const [newName] = await this.askQuestion("Enter new name:");
      if (!newName) {
        console.log("Wrong input, try again");
        return this.register();
      }

      const [bool] = await this.askQuestion(
        `Are you sure you want to create a new user with name ${newName} (y/n)`
      );
      if (bool.toLowerCase() !== "y") {
        console.log("Let's try again");
        return this.register();
      }

      if (this.users.find((el) => el.name === newName)) {
        console.log("User already exist");
        return this.register();
      }

      const x = await this.client.query(`INSERT INTO users(name) VALUES ('${newName}')`);
      await this.updateUsers();
      this.userData = this.users.filter((el) => el.name === newName)?.[0];
      this.loggedStatus = true;
      console.log(`User ${newName} has been created`);
      return this.todoManage();
    } catch (error) {
      console.log("Database query error, try again");
      console.error(error);
      return this.register();
    }
  }

  askQuestion(prompt) {
    return new Promise((resolve) => {
      rl.question(`${prompt}\n`, (answer) => {
        const argv = yargs.parse(answer);
        resolve(argv?._);
      });
    });
  }

  async todoManage() {
    if (this.firstUse) {
      console.log(`\nHey ${this.userData.name}! Now you can manage your todo list`);
      console.log('TIP: Enter "helpMe" for a command list');
      this.firstUse = false;
    }

    const [command, parameter] = await this.askQuestion("Enter command:");
    // Commands usage
    switch (command) {
      case "new":
        return this.handleNew();
      case "list":
        return this.handleList(parameter);
      case "done":
        return this.handleDone(parameter);
      case "delete":
        return this.handleDelete(parameter);
      case "helpMe":
        return this.handleHelp();
      case "version":
        return this.handleVersion();
      case "end":
        return this.handleEnd();
      default:
        return this.todoManage();
    }
  }
  async handleNew() {
    try {
      console.log("new");
      // Get TODO item name
      const itemNameArr = await this.askQuestion("Enter name of your new TODO task:");
      const itemName = itemNameArr.join(" ");
      // Empty input validation
      if (!itemName) {
        throw new Error("Wrong item name");
      }

      // Get priority type
      const [itemPriority] = await this.askQuestion("Enter priority of your new TODO task (A, B, C, D, E)");
      // Validate priority type
      if (!this.priorityTypes.some((el) => el === itemPriority?.toLowerCase())) {
        throw new Error("Wrong priority type, should be A-E");
      }

      // Ask for confirmation
      const [bool] = await this.askQuestion(
        `Are you sure you want to create a new task "${itemName}" ${itemPriority} Priority? (y/n)`
      );
      if (bool.toLowerCase() !== "y") {
        throw new Error("Item adding canceled");
      }

      // Add new todo task
      const x = await this.client.query(
        `INSERT INTO todo_items (user_id, title, priority) VALUES (${this.userData.id}, '${itemName}', '${itemPriority}')`
      );
      console.log("Task added successfully");

    } catch (error) {
      console.error(error.message + 💥💥💥);
    } finally {
      return this.todoManage();
    }
  }

  handleList() {
    console.log("List");
    return this.todoManage();
  }
  handleDone() {
    console.log("Done");
    return this.todoManage();
  }
  handleHelp() {
    console.log("Help");
    return this.todoManage();
  }
  handleVersion() {
    console.log("Done");
    return this.todoManage();
  }
  handleDelete(id) {
    console.log(`Deleting todo item with ID ${id}`);
    return this.todoManage();
  }
  handleEnd() {
    console.log("Thank's for using our TODO app, we hope you enjoy it!");
    process.exit(0);
  }
  async updateUsers() {
    const { rows } = await this.client.query(`SELECT * FROM users`);
    this.users = rows;
  }
}

const app1 = new App();
app1.init();

// async function app() {

//   // Logging Status
//   while (!loggedStatus) {

//     console.log("Wrong input");
//   }
//   // main functionality

//   while (programRun) {
//     const commandAnswer = await this.askQuestion("Enter command:");
//     const argv = yargs.parse(commandAnswer);
//     const commandName = argv?._[0]?.toLowerCase();
//     const parameter = argv?._[1];
//     // console.log(commandName, parameter);

//
//   }
// }
// app();
