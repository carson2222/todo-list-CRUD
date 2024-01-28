function askQuestion(prompt) {
  return new Promise((resolve) => {
    rl.question(`${prompt}\n`, (answer) => {
      resolve(answer);
    });
  });
}
module.exports = askQuestion;
