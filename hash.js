const bcrypt = require("bcrypt");

const hash = bcrypt.hashSync("1996123AB", 10);
console.log(hash);
