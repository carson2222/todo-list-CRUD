const { Pool, Client } = require("pg");
const path = require("path");

require("dotenv").config({
  override: true,
  path: path.join(__dirname, "development.env"),
});

const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT,
});

async function databaseConnect() {
  try {
    client = await pool.connect();
    // rows = await client.query("select * from users");
    // console.log(rows);
    // const userData = rows.find((el) => el.name === inputName);
    // if (userData) {
    //   console.log(`Welcome ${userData.name} your ID is ${userData.id}`);
    // } else {
    //   console.log("failed to log in");
    // }
    return client;
  } catch (error) {
    console.error(error);
  } finally {
    // client.release();
  }
}

module.exports = { databaseConnect };
