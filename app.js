const { databaseConnect } = require("./databaseConnect");
const chalk = require("chalk");
const readline = require("readline");
const { version } = require("./package.json");
const _ = require("lodash");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const yargs = require("yargs");

class App {
  constructor() {
    this.client;
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

      // Start the app
      console.log(chalk.yellow("------------------------"));
      console.log("Welcome in the TODO List app");
      console.log("To start, you have to log in to your todo list or create a new one");
      console.log(chalk.bold("TIP:") + ' type "exit" to leave the program anytime');
      return this.auth();
    } catch (error) {
      console.error(chalk.red(error.message));

      return this.init();
    }
  }

  async auth() {
    try {
      const [action] = await this.askQuestion(`What do you want to do? ${chalk.italic("(login/create)")}`);

      // Start login process
      if (action?.toLowerCase() === "login") return this.logIn();

      // Start registering process
      if (action?.toLowerCase() === "create") return this.register();

      // Throw error if the input does not match action types
      throw new Error(`Wrong answer, the input should be: ${chalk.italic("(login/create)")}`);
    } catch (error) {
      console.error(chalk.red(error.message));
      return this.auth();
    }
  }

  async logIn() {
    try {
      // Get user's name
      const [name] = await this.askQuestion("Enter your name");
      if (!name) throw new Error("Name can NOT be empty");

      // Check if the user exist
      const { rows: userExist } = await this.client.query(`SELECT id, name FROM users WHERE name = '${name}'`);
      if (!userExist[0]) throw new Error(`There is no user with name: ${name}, try again`);

      // Get password
      const [password] = await this.askQuestion("Enter your password");
      if (!password) throw new Error("Password can NOT be empty");

      // Check if the password matches
      const { rows: user } = await this.client.query(
        `SELECT id, name FROM users WHERE name = '${name}' AND password = crypt('${password}', password);`
      );

      if (!user?.[0]) throw new Error("Wrong password");

      // Login and start the app
      this.userData = user?.[0];
      this.loggedStatus = true;
      console.log(chalk.green(chalk.bold("Successfully logged in")));
      return this.todoManage();
    } catch (error) {
      console.error(chalk.red(error.message));
      return this.logIn();
    }
  }

  async register() {
    try {
      // Get user's new name
      const [newName] = await this.askQuestion("Enter new name:");
      // Validate for empty input
      if (!newName) throw new Error("Name can NOT be empty");

      // Check if the user already exist
      const { rows } = await this.client.query(`SELECT id, name FROM users WHERE name = '${newName}'`);
      if (rows?.[0]) throw new Error(`"${newName}" user already exist`);

      // Get user's new name
      const [password] = await this.askQuestion("Enter new password:");
      // Validate password
      if (
        password.length < 8 ||
        !/[A-Z]/.test(password) ||
        !/\d/.test(password) ||
        !/[!@#$%^&*(),.?":{}|<>]/.test(password)
      )
        throw new Error(
          "The password must be at least 8 characters long, 1 number, 1 special character and 1 uppercase letter"
        );

      // New user create confirmation
      const [bool] = await this.askQuestion(
        `Are you sure you want to create a new user with name ${newName} (y/n)`
      );
      if (bool.toLowerCase() !== "y") {
        console.log("Let's try again");
        return this.register();
      }

      // Insert new user into database
      const x = await this.client.query(
        `INSERT INTO users(name, password) VALUES ('${newName}', crypt('${password}', gen_salt('bf')))`
      );

      // Update userData
      const { rows: user } = await this.client.query(
        `SELECT id, name FROM users WHERE name = '${newName}' AND password = crypt('${password}', password);`
      );
      if (!user?.[0]) throw new Error("Failed to log into account");

      // Launch the app
      this.userData = user[0];
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
      rl.question(`${chalk.bold(chalk.yellow(prompt))}\n`, (answer) => {
        // Parse the user's answer using the yargs library
        const argv = yargs.parse(answer);

        // Check if the user want's to exit the program any time
        if (argv?._[0]?.toLowerCase() === "end") return this.handleEnd();

        // Resolve the promise with the parsed answer
        resolve(argv?._);
      });
    });
  }

  async todoManage() {
    // Display the information message only at the first app usage
    if (this.firstUse) {
      console.log(`\n${chalk.bold("Hey " + this.userData.name)}! Now you can manage your todo list`);
      console.log(`${chalk.bold("TIP:")} Enter "helpMe" for a command list`);
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
        console.log(chalk.red(`The ${command} command not found. Use "helpMe"`));
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
        `INSERT INTO todo_items (user_id, title, priority, status) VALUES (${this.userData.id}, '${itemName}', '${itemPriority}', 'pending')`
      );
      console.log(chalk.green("Task added successfully"));
    } catch (error) {
      console.error(chalk.red(error.message));
    } finally {
      return this.todoManage();
    }
  }

  async handleList(parameter) {
    console.log(parameter);
    // Run different query depends on the parameter specified
    const parameters = ["all", "pending", "done"];
    if (!parameters.includes(parameter?.toLowerCase())) {
      console.log(
        chalk.red(`Parameter: "${parameter}" does not exists. Here are the options: (${parameters.join("/")})`)
      );
      return this.todoManage();
    }

    const list = await this.listGet(parameter);
    if (!list) return this.todoManage();
    const listSorted = await this.listSort(list, parameter);
    this.listDisplay(listSorted);
    return this.todoManage();
  }

  handleDone() {
    console.log("Done");
    return this.todoManage();
  }

  handleHelp() {
    console.log(chalk.underline("Here is the list of all commands:"));
    console.log(`${chalk.bold("new")} - ${chalk.gray("add a new todo item")}`);
    console.log(`${chalk.bold("list <all|pending|done>")} - ${chalk.gray("list the todo items")}`);
    console.log(`${chalk.bold("done <id>")} - ${chalk.gray("update a todo item")}`);
    console.log(`${chalk.bold("delete <id>")} - ${chalk.gray("delete a todo item")}`);
    console.log(`${chalk.bold("helpMe")} - ${chalk.gray("list all the available commands")}`);
    console.log(`${chalk.bold("version")} - ${chalk.gray("print the version of the application")}`);

    return this.todoManage();
  }

  handleVersion() {
    console.log(chalk.bold(`App version: ${version}`));
    return this.todoManage();
  }

  handleDelete(id) {
    console.log(`Deleting todo item with ID ${id}`);
    return this.todoManage();
  }

  handleEnd() {
    console.log(chalk.red("Thank's for using our TODO app, we hope you enjoy it!"));
    process.exit(0);
  }
  async listGet(type) {
    // Get TODOs data for the user depending on the type
    let list = [];

    switch (type) {
      case "all":
        const { rows: listAll } = await this.client.query(
          `SELECT * FROM todo_items WHERE user_id = '${this.userData.id}'`
        );
        list = listAll;
        break;
      case "pending":
        const { rows: listPending } = await this.client.query(
          `SELECT * FROM todo_items WHERE user_id = '${this.userData.id}' AND status = 'pending'`
        );
        list = listPending;
        break;
      case "done":
        const { rows: listDone } = await this.client.query(
          `SELECT * FROM todo_items WHERE user_id = '${this.userData.id}' AND status = 'done'`
        );
        list = listDone;
        break;
    }

    // Check if the data is empty
    if (list.length === 0) {
      if (type === "all") {
        console.log(chalk.red("You have no tasks TODO"));
      } else {
        console.log(chalk.red(`You have no tasks TODO with a status of ${chalk.bold(type)}`));
        console.log(chalk.italic('You can add new items by using "new"'));
      }
      return undefined;
    }

    return list;
  }

  async listSort(list, type) {
    // If there is only 1 item, just return the list back
    if (list.length === 1) return list;

    // Sort data if there are more than 1 items
    if (list.length > 1) {
      // Ask user for a sortingType
      let sortingTypes = ["date", "title", "priority", "status"];
      if (type !== "all") sortingTypes = sortingTypes.filter((el) => el !== "status");
      let [sorting] = await this.askQuestion(`How do you want to sort the items? (${sortingTypes.join("/")}))`);
      sorting = sorting?.toLowerCase();

      // Sort the data
      let sortingType;
      if (sorting === "date") {
        sortingType = "id";
      } else if (sorting === "title" || sorting === "priority" || sorting === "status") {
        sortingType = sorting;
      } else {
        console.log(chalk.red(`Wrong sorting type, should be: ${chalk.italic("(date/title/priority/status)")}`));
        return this.handleList(parameter);
      }
      return _.sortBy(list, `${sortingType}`);
    }
  }
  listDisplay(list) {
    list.map((el) => {
      console.log(`${chalk.bold(el.title)} - ${el.priority} - ${el.status}`);
    });
  }
}

const app1 = new App();
app1.init();
