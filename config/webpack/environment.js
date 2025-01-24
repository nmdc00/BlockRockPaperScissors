const { environment } = require('@rails/webpacker');
const Dotenv = require('dotenv-webpack');

environment.plugins.prepend(
  'Dotenv',
  new Dotenv({
    path: './.env', // Path to your .env file
  })
);

module.exports = environment;
