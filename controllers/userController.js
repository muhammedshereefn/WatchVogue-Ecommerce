const { sendOtp } = require('../models/nodemailer');
const { Product } = require('../models/product');
const User = require('../models/userModel');
const category = require('../models/category');

const loadRegister = async(req,res)=>{
   try {
      
      res.render('registration',{message:'',errMessage:''})

   } catch (error) {
      console.log(error.message)
   }
}

// const insertUser = async(req,res)=>{
//    try {
//       const email = req.body.email
//       const checkData = await User.findOne({email:email});

//       if(checkData){
//          res.render('registration',{errMessage:'User already founded',message:''});
//       }else{
//          const user = {
//             name:req.body.name,
//             email:req.body.email,
//             password:req.body.password,
//             mobile:req.body.mobile
//          }
//          req.session.otp = sendOtp(user.email)
//          req.session.userData = user
      
//          // if(userData){
//          //    res.render('registration',{message:'Registration Successfull Go and Login',errMessage:''})
//          // }
//          res.redirect('/otp')
//       }

      
//    } catch (error) {
//       console.log(error.message)
//    }
// }




const insertUser = async (req, res) => {
   try {
     const email = req.body.email;
     const checkData = await User.findOne({ email: email });
 
     if (checkData) {
       res.render('registration', { errMessage: 'User already found', message: '' });
     } else {
       const user = new User({
         name: req.body.name,
         email: req.body.email,
         password: req.body.password,
         mobile: req.body.mobile,
       });
 
       await user.save(); // Save the user to the database
 
       req.session.otp = sendOtp(user.email);
       req.session.userData = user;
 
       res.redirect('/otp');
     }
   } catch (error) {
     console.log(error.message);
   }
 };



const otpPage = (req,res,next) => {
   if(req.session.userData) {
      res.render('otp')
   } else {
      res.redirect('/register')
   }
}




const verifyotp = async (req, res) => {
   try {
     // Check if OTP is provided in the request body
     if (req.body.otp) {
       // Check if the provided OTP matches the one stored in the session
       if (req.session.otp === req.body.otp) {
         // If OTP is correct, redirect to the login page
         res.redirect('/login');
       } else {
         // If OTP is incorrect, return a 401 Unauthorized response
         return res.status(401).send("Incorrect OTP");
       }
     } else {
       // If no OTP is provided in the request, you can handle this case as needed
       return res.status(400).send("OTP is required");
     }
   } catch (error) {
     console.error(error);
     return res.status(500).send("Internal Server Error");
   }
 };
 




// login user

const loaddLogin = async(req,res)=>{
   try {  
      


      const products = await Product.find({status:true})
      const cata = await category.find()


      
      res.render('home',{message:'',userId:(req.session.user_id) ? req.session.user_id : '' , products,cata ,
   userName : ' PLease login'});

   } catch (error) {
      console.log(error.message);
   }
}



const loadLogin = async(req,res)=>{
   try {  

      res.render('login',{message:''});

   } catch (error) {
      console.log(error.message);
   }
}


const verfiyUser = async(req,res)=>{
   try {
      const email = req.body.email;
      const password = req.body.password;

      const userData = await User.findOne({email:email});
      if(userData){
         if(userData.password === password){
            console.log(userData.isBlocked);
            if(userData.isBlocked===false) {
               req.session.user_id = userData._id
               res.redirect('/home')
            } else  {
               res.redirect('/login')
            }
         }else{
            res.render('login',{message:"Invalid email or password"});
         }
      }else{
         res.render('login',{message:'Invalid email or password'})
      }

   } catch (error) {
      console.log(error)
   }
}


const loadHome = async(req,res)=>{
   try {
      let user = { name : 'For better experience please login'}
   if(req.session){
      const userId = req.session.user_id
      user = await User.findOne({_id:userId})
   }
      
      
      const products = await Product.find({status:true})
      const cata = await category.find()
  res.render('home',{userId:(req.session.user_id) ? req.session.user_id : '',
  products,
  cata,
  userName:user.name});
     
      
   } catch (error) {
      console.log(error)
   }
}






const userLogout = async(req,res)=>{
   try {
      req.session.user_id = null;
      res.redirect('/');
   } catch (error) {
      console.log(error.message);
   }
}


const loadProductDetails = async (req,res)=>{
   try {

      
      const productId = req.params.id 
      
      const productdetails = await Product.findById(productId)

      res.render('productDetails',{userId:(req.session.user_id) ? req.session.user_id : '',productdetails})
   } catch (error) {
      console.log(error);
      
   }
}

const loadCategoryPage = async (req,res)=>{
  try {
   const cata = await category.find({isListed:true})
   res.render('categoryPage',{userId:(req.session.user_id) ? req.session.user_id : '',cata})
  } catch (error) {
   console.log(error);
  } 
}




module.exports = {
   loadRegister,
   insertUser,
   loaddLogin,
   verfiyUser,
   loadHome,
   userLogout,
   otpPage,
   loadLogin,
   verifyotp,
   loadProductDetails,
   loadCategoryPage
   
}