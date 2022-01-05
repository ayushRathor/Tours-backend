const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  // console.log(res.body);
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // console.log({ email, password });
  if (!email) {
    return next(new AppError('Please provide email!', 400));
  }
  if (!password) {
    return next(new AppError('Please provide password!', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password'));
  }

  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1)getting token and checks if it's there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // console.log(req.headers.authorization);
  if (!token) {
    return next(new AppError('Not Authorized!', 401));
  }
  // console.log("in protext",token)
  //2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) check if user still exist
  // console.log('in protext', decoded);
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('User  with this token no longer exists!', 401));
  }
  //4)check if userchanged the password after the token issued to the user.
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('Password recently changed!Please login again!', 401)
    );
  }
  req.user = currentUser;
  next();
});

exports.restrictedTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have access to perform this action!', 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1)get user based on the posted email
  const user = await User.findOne(req.email);
  if (!user) {
    return next(new AppError('User with this email does not exist!', 404));
  }

  //2) generate random reset token

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3) send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  console.log('in forgot', user);
  const message = `Forgot your password? Please reset your password by clicking on the link:${resetURL}. If you did't 
  forget your password,please ignore this message.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to your email!',
    });
  } catch (error) {
    console.log(error);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('An error ocuured,Try again later', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) get user based on token
  // console.log("in reset",req.params)
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
  });
  console.log('in reset', user);
  // return;
  //2)If token has not expires there is a user, set the new password
  if (!user) {
    return next(new AppError('Invalid Token or token expired!'));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordExpires = undefined;
  await user.save();

  //3)Update changedPasswordAt property for thae user

  //4)log the user in, send JWT
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1.check user from collection
  const user = await User.findById(req.user._id).select('+password');
  //2.check if posted current password is correct

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong!', 401));
  }
  //3.if so update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});
