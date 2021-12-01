const express = require('express');

const userController = require('../controllers/userController');

const router = express.Router();

router.route('/').get(userController.getAllUsers).post(userController.postUser);
router
  .route('/:id')
  .get(userController.getUserDetail)
  .patch(userController.patchUser)
  .delete(userController.deleteUser);

module.exports = router;
