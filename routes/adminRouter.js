const express = require('express');
const adminRouter = express();
const nocache = require('nocache')
const logger = require('morgan')

//upload multer///


const { upload } = require('../multer/multer');


const session = require('express-session');
const config = require('../config/config');

adminRouter.use(session({
  secret: config.sessionSecretId,
  resave: false,
  saveUninitialized: true
}))







const bodyParser = require('body-parser');
adminRouter.use(nocache())
adminRouter.use(logger('dev'))
adminRouter.set('view engine', 'ejs')
adminRouter.set('views', './views/admin')


adminRouter.use(bodyParser.json());
adminRouter.use(bodyParser.urlencoded({ extended: true }));

const auth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController')
adminRouter.get('/', auth.isLogout, adminController.loadLogin);
adminRouter.post('/', adminController.verifyAdmin);
// adminRouter.get('/home',auth.isLogin,adminController.loadhome);
adminRouter.get('/logout', auth.isLogin, adminController.logout);
adminRouter.get('/dashboard', auth.isLogin, adminController.loadDashboard);
adminRouter.get('/newUser', auth.isLogin, adminController.loadAddUser);
adminRouter.post('/newUser', auth.isLogin, adminController.addUser);
adminRouter.get('/editUser', auth.isLogin, adminController.editUserLoad);
adminRouter.post('/editUser', auth.isLogin, adminController.updateUser);
adminRouter.get('/deleteUser', auth.isLogin, adminController.deleteUser);

adminRouter.get('/userlist', auth.isLogin, adminController.loadUserlist);

adminRouter.post('/searchUser', auth.isLogin, adminController.searchUser);



adminRouter.get('/block', auth.isLogin, adminController.block);
adminRouter.get('/unblock', auth.isLogin, adminController.unblock);

adminRouter.get('/category', auth.isLogin, adminController.loadCategory)
adminRouter.post('/createCategory', auth.isLogin, adminController.createCategory)

adminRouter.get('/category/block', auth.isLogin, adminController.blockCategory)
adminRouter.get('/category/unblock', auth.isLogin, adminController.unBlockCategory)

adminRouter.get('/categoryEdit', auth.isLogin, adminController.editcat);
adminRouter.post('/editingcat', auth.isLogin, adminController.posteditCat);




adminRouter.get('/productlist', auth.isLogin, adminController.loadProduct)
adminRouter.get('/addproduct', auth.isLogin, adminController.loadAddProduct)


// adminRouter.get('/lis')





// adminRouter.post('/productAdding', upload.array('images' , 12) , auth.isLogin,adminController.addingProduct)

adminRouter.post('/addproduct', upload.fields([{ name: 'coverimage', maxCount: 1 }, { name: 'images' }]), adminController.productadding)

adminRouter.get('/editproduct', auth.isLogin, adminController.loadEditProduct)
adminRouter.post('/editproduct', upload.fields([{ name: 'images' }]), auth.isLogin, adminController.editProduct)

adminRouter.get('/productunblock', auth.isLogin, adminController.productUnlist)
adminRouter.get('/productblock', auth.isLogin, adminController.productList)




adminRouter.get('*', (req, res) => { res.redirect('/admin') })


module.exports = adminRouter;
