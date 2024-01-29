const priorityTypes = ["a", "b", "c", "d", "e"];
async function handleNew() {
  let addSuccess = false;
  while (!addSuccess) {
    console.log("new");
    const itemNameAnswer = await this.askQuestion("Enter name of your new TODO task");
    const argv = yargs.parse(itemNameAnswer);
    const itemName = argv?._[0];
    if (!itemName) {
      console.log("Wrong item name");
      continue;
    }

    const itemPriorityAnswer = await this.askQuestion("Enter priority of your new TODO task (A, B, C, D, E)");
    const argv2 = yargs.parse(itemPriorityAnswer);
    const itemPriority = argv?._[0]?.toLowerCase();
    if (!priorityTypes.some((el) => el === itemPriority)) {
      console.log("Wrong parameter");
      continue;
    }
    // INSERT INTO todo_items (user_id, title, priority) VALUES (1, 'I like potatoes', 'A')
    // add new todo task
  }
}
function handleList() {
  console.log("List");
}
function handleDone() {
  console.log("Done");
}
function handleHelp() {
  console.log("Help");
}
function handleVersion() {
  console.log("Done");
}
function handleDelete(id) {
  console.log(`Deleting todo item with ID ${id}`);
}
function handleEnd() {
  console.log("End");
}

module.exports = { handleNew, handleList, handleDone, handleHelp, handleVersion, handleDelete, handleEnd };
