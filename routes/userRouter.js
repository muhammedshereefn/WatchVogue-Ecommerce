const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const nocache = require('nocache')
const logger = require('morgan')
const userRouter = express();


const auth = require('../middleware/authentication')
const userController = require('../controllers/userController');
const config = require('../config/config')
userRouter.use(nocache());
userRouter.use(session({
   secret:config.sessionSecretId,
   resave: false,
  saveUninitialized: true
}))
userRouter.use(bodyParser.json());
userRouter.use(bodyParser.urlencoded({extended:true}));
userRouter.use(logger('dev'))
userRouter.set('view engine','ejs');
userRouter.set('views','./views/users');



// registration user
userRouter.get('/register',auth.isLogout,userController.loadRegister);
userRouter.post('/register',userController.insertUser);
userRouter.get('/otp',userController.otpPage)
userRouter.post('/verifyOtp',userController.verifyotp)

// login user

userRouter.get('/',auth.isLogout, userController.loaddLogin);
userRouter.get('/login',auth.isLogout,userController.loadLogin);
userRouter.post('/login',auth.isLogout,userController.verfiyUser);

userRouter.get('/home',auth.isLogin,userController.loadHome);

userRouter.get('/productdetails/:id', userController.loadProductDetails)

userRouter.get('/categoryPage',auth.isLogin,userController.loadCategoryPage)


userRouter.get('/logout',auth.isLogin,userController.userLogout)
 
module.exports = userRouter;
