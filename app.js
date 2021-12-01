const express = require('express'); //including express pkg
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express(); //accessing all functions in app by calling express function
app.use(express.json());

// eslint-disable-next-line no-console
console.log(process.env.NODE_ENV);

if (process.env.NOD_ENV === 'dev') app.use(morgan('dev'));
app.use(express.static(`${__dirname}/public`));

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.all('*', (req, res, next) => {
  //   const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  //   err.statusCode = 404;
  //   err.status = 'fail';
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
