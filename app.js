const { databaseConnect } = require("./databaseConnect");
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
      // Database connect
      this.client = await databaseConnect();
      if (!this.client) throw new Error("Failed to connect to the Database");

      // Get users data from database
      const { rows } = await this.client.query(`SELECT * FROM users`);
      this.users = rows;
      if (!rows) throw new Error("Failed to get users data");

      // Start the app
      console.log("🥰😘🥰------------------------🥰😘🥰");
      console.log("Welcome in the TODO List app");
      console.log("To start, you have to log in to your todo list or create a new one");
      return this.auth();
    } catch (error) {
      console.error(`${error.message} 💥💥💥`);
      return this.init();
    }
  }

  async auth() {
    try {
      const [action] = await this.askQuestion("What do you want to do? (login/create)");

      // Start login process
      if (action?.toLowerCase() === "login") return this.logIn();

      // Start registering process
      if (action?.toLowerCase() === "create") return this.register();

      // Throw error if the input does not match action types
      throw new Error("Wrong answer, the input should be: (login/create)");
    } catch (error) {
      console.error(`${error.message} 💥💥💥`);
    }
  }

  async logIn() {
    try {
      // Get user's name
      const [name] = await this.askQuestion("Enter your name");
      if (!name) throw new Error("Name can NOT be empty");

      // Update users data
      await this.updateUsers();
      // Get the user data
      this.userData = this.users.filter((el) => el.name === name)?.[0];

      // Throw error if there is no such a user
      if (!this.userData) throw new Error("Couldn't find the user");

      // Login and start the app
      this.loggedStatus = true;
      console.log("Successfully logged in ✅");
      return this.todoManage();
    } catch (error) {
      console.error(`${error.message} 💥💥💥`);
      return this.logIn();
    }
  }

  async register() {
    try {
      // Get user's new name
      const [newName] = await this.askQuestion("Enter new name:");
      // Validate for empty input
      if (!newName) throw new Error("Wrong input, try again");

      // New user create confirmation
      const [bool] = await this.askQuestion(
        `Are you sure you want to create a new user with name ${newName} (y/n)`
      );
      if (bool.toLowerCase() !== "y") {
        console.log("Let's try again");
        return this.register();
      }

      // Check if the user already exist
      if (this.users.find((el) => el.name === newName)) throw new Error(`"${newName}" user already exist`);

      // Insert new user into database & launch the
      const x = await this.client.query(`INSERT INTO users(name) VALUES ('${newName}')`);
      await this.updateUsers();
      this.userData = this.users.filter((el) => el.name === newName)?.[0];
      this.loggedStatus = true;
      console.log(`User ${newName} has been created`);
      return this.todoManage();
    } catch (error) {
      console.error(`${error.message} 💥💥💥`);
      return this.register();
    }
  }

  askQuestion(prompt) {
    return new Promise((resolve) => {
      // Use the readline interface to ask the user a question
      rl.question(`${prompt}\n`, (answer) => {
        // Parse the user's answer using the yargs library
        const argv = yargs.parse(answer);
        // Resolve the promise with the parsed answer
        resolve(argv?._);
      });
    });
  }

  async todoManage() {
    // Display the information message only at the first app usage
    if (this.firstUse) {
      console.log(`\nHey ${this.userData.name}! Now you can manage your todo list`);
      console.log('TIP: Enter "helpMe" for a command list');
      this.firstUse = false;
    }

    // Ask user for the command
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
        // Restart if the user used incorrect command
        console.log(`The ${command} command not found. Use "helpMe"`);
        return this.todoManage();
    }
  }

  async handleNew() {
    try {
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
      await this.client.query(
        `INSERT INTO todo_items (user_id, title, priority) VALUES (${this.userData.id}, '${itemName}', '${itemPriority}')`
      );
      console.log("Task added successfully");
    } catch (error) {
      console.error(`${error.message} 💥💥💥`);
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