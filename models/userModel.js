const mongoose = require('mongoose');
const validator = require('validator');

//name,email,photo,password,passwordConfirm

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'name is required'],
    trim: true,
    maxlength: [40, 'name must have less or equal then 40 characters'],
    minlength: [10, 'name must have more or equal then 10 characters'],
  },
  email: {
    type: String,
    required: [true, 'name is required'],
    trim: true,
    lowercase: true,
    unique: true,
    validator: [validator.isEmail, 'Enter a valid Email'],
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    required: [true, 'password is required'],
    trim: true,
    maxlength: [40, 'password must have less or equal then 40 characters'],
    minlength: [8, 'password must have more or equal then 8 characters'],
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Confirm password is required'],
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
