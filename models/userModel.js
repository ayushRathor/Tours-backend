const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
    required: [true, 'email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    validator: [validator.isEmail, 'Enter a valid Email'],
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  photo: {
    type: String,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  password: {
    type: String,
    required: [true, 'password is required'],
    trim: true,
    maxlength: [40, 'password must have less or equal then 40 characters'],
    minlength: [8, 'password must have more or equal then 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Confirm password is required'],
    //This will only work with create and save
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordExpires: Date,
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = function (
  candidatePassword,
  userPassword
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt / 1000, 10);
    return changedTimestamp > JWTTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordExpires = Date.now() + 10 * 60 * 1000;
  console.log(resetToken, this.passwordResetToken);
  return resetToken;
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  //Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //Delete passwordConfirm field
  this.passwordConfirm = undefined;
});

const User = mongoose.model('User', userSchema);
module.exports = User;
