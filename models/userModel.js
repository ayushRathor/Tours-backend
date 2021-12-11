const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

//name,email,photo,password,passwordConfirm

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'name is required'],
    trim: true,
    maxlength: [40, 'name must have less or equal then 40 characters'],
    minlength: [2, 'name must have more or equal then 10 characters'],
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
    //This will only work with create and save
    validate: {
      validator: function (el) {
        return el === this.password;
      },
    },
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  //Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //Delete passwordConfirm field
  this.passwordConfirm = undefined;
});

const User = mongoose.model('User', userSchema);
module.exports = User;
