require('dotenv').config();

const app = require('./app');
const sequelize = require('./config/database');

const port = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    app.listen(port, () => {
      console.log(`Server is running on port ${port}.`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    process.exitCode = 1;
  }
}

startServer();
