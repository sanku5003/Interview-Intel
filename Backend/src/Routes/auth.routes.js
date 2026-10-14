const express = require('express')
const authController = require('../Controllers/auth.controller')
const authRouter = express.Router();
const authUser = require('../middleware/auth.middleware');

/**
 * @route POST/api/auth/register
 * @description Register new user
 * @access Public
 */

authRouter.post('/register' , authController.registerUserController);

/**
 * @route POST/api/auth/login
 * @description Login user
 * @access Public
 */

authRouter.post('/login' , authController.loginUserController);

/**
 * @route POST/api/auth/forgot-password
 * @description Send a password-recovery code
 * @access Public
 */

authRouter.post('/forgot-password', authController.forgotPasswordController);

/**
 * @route POST/api/auth/verify-password-reset-code
 * @description Verify a recovery code
 * @access Public
 */

authRouter.post('/verify-password-reset-code', authController.verifyPasswordResetCodeController);

/**
 * @route POST/api/auth/reset-password
 * @description Reset a password after code verification
 * @access Public
 */

authRouter.post('/reset-password', authController.resetPasswordController);


/** * @route POST/api/auth/logout
 * @description Logout user
 * @access Public
 */

authRouter.get('/logout' , authController.logoutUserController);

/**
 * @route GET/api/auth/get-me
 * @description Get current user
 * @access Private
 */

authRouter.get('/get-me' , authUser , authController.getMeController);


module.exports = authRouter;