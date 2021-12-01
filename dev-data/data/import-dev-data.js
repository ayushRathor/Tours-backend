/* eslint-disable no-console */
const fs = require('fs');
const mongoose = require('mongoose');
const dotEnv = require('dotenv');
const Tour = require('../../models/toursModel');

dotEnv.config({ path: './config.env' });
// console.log(process.env);
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

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
);

const importAllTours = async () => {
  try {
    await Tour.create(tours);
    console.log('successfuly imported');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

const deleteAllTours = async () => {
  try {
    await Tour.deleteMany();
    console.log('successfuly deleted');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};
console.log(process.argv[2]);
if (process.argv[2] === '--import') {
  importAllTours();
} else if (process.argv[2] === '--delete') {
  deleteAllTours();
}
// console.log(process.argv);
