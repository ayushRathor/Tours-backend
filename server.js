const mongoose = require('mongoose');
const dotEnv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED EXCEPTION,Shutting down.....');
  process.exit(1);
});

dotEnv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB Connected'));

const app = require('./app');
// console.log("---------");
const port = 3000;
//listening at port(3000), callback will execute when server starts lishening.
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION,Shutting down.....');
  server.close(() => {
    process.exit(1);
  });
});
