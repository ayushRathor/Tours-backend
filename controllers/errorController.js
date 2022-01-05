const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = (err) => {
  const value = err.errmsg.match(/(["']).*?\1/)[0];
  console.log(value);
  const message = `Duplicate field value: ${value},pleae use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data:  ${errors.join('. ')}.`;
  return new AppError(message, 400);
};

const handleJsonWebTokenError = () =>
  new AppError('Invalid Token!please login again!', 401);

const handleTokenExpiredError = () =>
  new AppError('Token expired!please login again!', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client

  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error('ERROR--', err);
    res.status(err.statusCode).json({
      status: 'error',
      message: 'Someting went wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  // console.log("checj jw",err);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    let error = Object.create(err);
    // console.log("nME---",error.name);
    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }

    if (error.code === 11000) {
      error = handleDuplicateFieldDB(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJsonWebTokenError();
    }
    if (error.name === 'TokenExpiredError') {
      error = handleTokenExpiredError();
    }
    // console.log('errrrr---', error);
    sendErrorProd(error, res);
  } else {
    console.log('mkskmsks');
  }
};
