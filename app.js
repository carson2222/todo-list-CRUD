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
      // Ask for authentication type
      const [action] = await this.askQuestion(`What do you want to do? ${chalk.italic("(login/register)")}`);

      // Start login process
      if (action?.toLowerCase() === "login") await this.logIn();
      // Start registering process
      else if (action?.toLowerCase() === "register") await this.register();
      else {
        // Throw error if the input does not match action types
        throw new Error(`Wrong answer, the input should be: ${chalk.italic("(login/register)")}`);
      }

      // Start the app
      this.todoManage();
    } catch (error) {
      console.error(chalk.red(error.message));
      return this.auth();
    }
  }

  async logIn() {
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
  }

  async register() {
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
    const [bool] = await this.askQuestion(`Are you sure you want to create a new user with name ${newName} (y/n)`);
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
    console.log(chalk.green(`User ${newName} has been created`));
    return;
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
    try {
      // Display the information message only at the first app usage
      if (this.firstUse) {
        console.log(`\n${chalk.bold("Hey " + this.userData.name)}! Now you can manage your todo list`);
        console.log(`${chalk.bold("TIP:")} Enter "helpMe" for a command list`);
        this.firstUse = false;
      }

      // Ask user for the command
      const [command, parameter] = await this.askQuestion("Enter command:");

      // Commands handling
      switch (command) {
        case "new":
          await this.handleNew();
          break;
        case "list":
          await this.handleList(parameter);
          break;
        case "done":
          await this.handleDone(parameter);
          break;
        case "delete":
          await this.handleDelete(parameter);
          break;
        case "helpMe":
          this.handleHelp();
          break;
        case "version":
          this.handleVersion();
          break;
        case "end":
          this.handleEnd();
          break;
        default:
          // Throw error if the user used incorrect command
          throw new Error(`The ${command} command not found. Use "helpMe"`);
      }
      return this.todoManage();
    } catch (error) {
      console.log(chalk.red(error.message));
      return this.todoManage();
    }
  }

  async handleNew() {
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
  }

  async handleList() {
    // Ask for item's status type
    const parameters = ["all", "pending", "done"];
    const [parameter] = await this.askQuestion(
      `Enter status type of items you want to display (${parameters.join("/")})`
    );

    // Throw error if the answer doesn't match available options
    if (!parameters.includes(parameter?.toLowerCase())) {
      throw new Error(
        `Parameter: "${parameter}" does not exists. Here are the options: (${parameters.join("/")})`
      );
    }

    // Get list data from database
    const list = await this.listGet(parameter);
    // If the data is empty, throw error
    if (!list) throw new Error("Data is empty");
    // Sort the list
    const listSorted = await this.listSort(list, parameter);
    // Display the sorted list
    this.listDisplay(listSorted);
  }

  async handleDone() {
    // Ask for title of the item user wants to mark as done
    const [title] = await this.askQuestion(`Enter title of the item you want to mark as DONE`);

    // Get the task from the database
    const { rows } = await this.client.query(
      `SELECT * FROM todo_items where title = '${title}' AND user_id = '${this.userData.id}'`
    );
    // Throw error if it exist
    if (!rows.length) throw new Error(`Can not find an item with title: ${title}`);

    // Throw error if the task is already done
    if (rows[0].status === "done") throw new Error(`The '${title}' task is already done`);

    // Edit the task status
    await this.client.query(`UPDATE todo_items SET
    status = 'done' WHERE
    id = ${rows[0].id} AND user_id = '${this.userData.id}'`);
    console.log(chalk.green(`${title} task has been done`));
  }

  handleHelp() {
    // Log all of the available commands
    console.log(chalk.underline("Here is the list of all commands:"));
    console.log(`${chalk.bold("new")} - ${chalk.gray("add a new todo item")}`);
    console.log(`${chalk.bold("list")} - ${chalk.gray("list the todo items")}`);
    console.log(`${chalk.bold("done")} - ${chalk.gray("update a todo item")}`);
    console.log(`${chalk.bold("delete")} - ${chalk.gray("delete a todo item")}`);
    console.log(`${chalk.bold("helpMe")} - ${chalk.gray("list all the available commands")}`);
    console.log(`${chalk.bold("version")} - ${chalk.gray("print the version of the application")}`);
  }

  handleVersion() {
    // Log the app's version, data taken from package.json
    console.log(chalk.bold(`App version: ${version}`));
  }

  async handleDelete() {
    // Ask for title of the item user wants to delete
    const [title] = await this.askQuestion(`Enter title of the item you want to delete`);

    // Get the item from the database
    const { rows } = await this.client.query(
      `SELECT * FROM todo_items where title = '${title}' AND user_id = '${this.userData.id}'`
    );

    // Check if the task exist
    if (!rows.length) throw new Error(`Can not find an item with title: ${title}`);

    // Ask for confirmation
    const [bool] = await this.askQuestion(`Are you sure you want to delete "${chalk.bold(title)}"? (y/n)`);
    if (bool.toLowerCase() !== "y") throw new Error(`Item deleting canceled`);

    // Delete the task status
    await this.client.query(
      `DELETE FROM todo_items WHERE id IN (${rows[0].id}) AND user_id = '${this.userData.id}'`
    );
    console.log(chalk.green(`${title} task has been deleted`));
  }

  handleEnd() {
    // Log the goodbye message
    console.log(chalk.green("Thank's for using our TODO app, we hope you enjoy it!"));
    // Exit the program
    process.exit(0);
  }
  async listGet(type) {
    let list = [];

    // Get TODOs data for the user depending on the type
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
        throw new Error("You have no TODO tasks ");
      } else {
        throw new Error(`You have no TODO tasks with a status of ${chalk.bold(type)}`);
      }
      return undefined;
    }

    // Return the data
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
        // Throw error if the parameter is wrong
        throw new Error(`Wrong sorting type, should be: ${chalk.italic("(date/title/priority/status)")}`);
      }
      // return sorted data
      return _.sortBy(list, `${sortingType}`);
    }
  }
  listDisplay(list) {
    // Map over the list of items and log them
    list.map((el) => {
      console.log(`${chalk.bold(el.title)} - ${el.priority} - ${el.status}`);
    });
  }
}

const app1 = new App();
app1.init();
