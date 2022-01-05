const express = require('express'); //including express pkg
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const http = require('http');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express(); //accessing all functions in app by calling express function

// eslint-disable-next-line no-console
// console.log(process.env.NODE_ENV);

//Global MIDDLEWARES

//set security http headers
app.use(helmet());

//development logging
if (process.env.NOD_ENV === 'dev') app.use(morgan('dev'));

//limiting requests from same IP
const limiter = rateLimit({
  max: 100,
  window: 60 * 60 * 1000,
  message: 'Too many request for this IP',
});
app.use('/api', limiter);

//Body parser,reading datafrom body into req.body
app.use(express.json({ limit: '10kb' }));

//Data sanitization against NoSQL query Injection
app.use(mongoSanitize());

//Data sanitization against Xss
app.use(xss());

//Prevent parameter polliution
app.use(
  http({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//Serving static files
app.use(express.static(`${__dirname}/public`));

// ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//Test Middleware
app.all('*', (req, res, next) => {
  //   const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  //   err.statusCode = 404;
  //   err.status = 'fail';
  // console.log("llllll-----",req)
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
// app.use((req,res,next)=>{
//     console.log("in app")
//     req.requestTime=new Date().toISOString();
//     next();
// })

// tourRouter.route('/').get(getAllTours).post(postTour);
// tourRouter.route('/:id').get(getTourDetail).patch(patchTour).delete(deleteTour);

// const port=3000;
// //listening at port(3000), callback will execute when server starts lishening.
// app.listen(port,()=>{
//     console.log(`App running on port ${port}`);
// })

module.exports = app;
