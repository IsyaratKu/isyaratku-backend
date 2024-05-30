require('dotenv').config();
const { Sequelize } = require('sequelize');


const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
    dialect: 'mysql'
});

module.exports = sequelize;