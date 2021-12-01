const express = require('express');

const tourController = require('../controllers/tourController');

const router = express.Router();
// app.use('/api/v1/tours',router);

// router.param('id', tourController.checkId);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router.route('/').get(tourController.getAllTours).post(tourController.postTour);
router
  .route('/:id')
  .get(tourController.getTourDetail)
  .patch(tourController.patchTour)
  .delete(tourController.deleteTour);

module.exports = router;
