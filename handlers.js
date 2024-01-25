function handleNew() {
  console.log("new");
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

module.exports = { handleNew, handleList, handleDone, handleHelp, handleVersion, handleDelete };
