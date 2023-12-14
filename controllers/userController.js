const { sendOtp } = require("../models/nodemailer");
const { sendPasswordResetLink } = require("../models/forgotnodemailer");
const { Product } = require("../models/product");
const User = require("../models/userModel");
const category = require("../models/category");
const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Coupon = require("../models/couponModel");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
var easyinvoice = require("easyinvoice");
const { Readable } = require("stream");

const loadRegister = async (req, res) => {
  try {
    req.session.referalCode = req.query.code;
    res.render("registration", { message: "", errMessage: "" });
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    const email = req.body.email;
    const checkData = await User.findOne({ email: email });

    if (checkData) {
      res.render("registration", {
        errMessage: "User already found",
        message: "",
      });
    } else {
      function generateRandomReferralCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
      }

      const referralCode = generateRandomReferralCode();

      const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        mobile: req.body.mobile,
        referalCode: referralCode,
      });

      const referalCode = req.session.referalCode;

      if (referalCode) {
        console.log("User get with Refferal invitation");
        // Find the user associated with the referral code
        const referredByUser = await User.findOne({ referalCode: referalCode });

        if (referredByUser) {
          // Add 200 rupees to the new user's wallet
          user.wallet += 200;

          // Add 50 rupees to the wallet of the user who shared the link
          referredByUser.wallet += 50;
          console.log("Amount added");

          // Save changes to both users
          await user.save();
          await referredByUser.save();
        }
      } else {
        console.log("User get without Refferal invitation");
      }

      await user.save(); // Save the user to the database

      req.session.otp = sendOtp(user.email);
      req.session.userData = user;

      res.redirect("/otp");
      console.log(req.session.otp);
    }
  } catch (error) {
    console.log(error.message);
  }
};

// const otpPage = (req, res, next) => {
//   if (req.session.userData) {
//     res.render("otp");
//   } else {
//     res.redirect("/register");
//   }
// };

const otpPage = (req, res, next) => {
  console.log(req.session.userData + "*********************************8");
  console.log(req.session.userData.email + ">>");
  if (req.session.userData && req.session.userData.email) {
    res.render("otp", { userEmail: req.session.userData.email });
  } else {
    res.redirect("/register");
  }
};

const verifyotp = async (req, res) => {
  try {
    console.log(req.session.otp);
    // Check if OTP is provided in the request body
    if (req.body.otp) {
      // Check if the provided OTP matches the one stored in the session
      if (req.session.otp === req.body.otp) {
        // If OTP is correct, redirect to the login page

        res.redirect("/login");
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

const resendOtp = async (req, res) => {
  try {
    const email = req.body.email; // Assuming the email is sent in the request body
    console.log("Resending OTP to:", email);
    const newOtp = sendOtp(email);

    // Update req.session.otp with the new OTP
    req.session.otp = newOtp;

    res.json({ message: "OTP Resent", newOtp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const loaddLogin = async (req, res) => {
  try {
    const products = await Product.find({ status: true });
    const cata = await category.find();

    res.render("home", {
      message: "",
      userId: req.session.user_id ? req.session.user_id : "",
      products,
      cata,
      userName: " PLease login",
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogin = async (req, res) => {
  try {
    res.render("login", { message: "" });
  } catch (error) {
    console.log(error.message);
  }
};

const verfiyUser = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.password === password) {
        if (userData.isBlocked === false) {
          req.session.user_id = userData._id;
          res.redirect("/home");
        } else {
          console.log("prashnm ind");
          res.redirect("/login");
        }
      } else {
        res.render("login", { message: "Invalid email or password" });
      }
    } else {
      res.render("login", { message: "Invalid email or password" });
    }
  } catch (error) {
    console.log(error);
  }
};

const loadHome = async (req, res) => {
  try {
    let user = { name: "For better experience please login" };
    if (req.session) {
      const userId = req.session.user_id;
      user = await User.findOne({ _id: userId });
    }

    const products = await Product.find({ status: true }).limit(8);
    const cata = await category.find();
    res.render("home", {
      userId: req.session.user_id ? req.session.user_id : "",
      products,
      cata,
      userName: user.name,
    });
  } catch (error) {
    console.log(error);
  }
};

const userLogout = async (req, res) => {
  try {
    req.session.user_id = null;
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

const loadProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;

    const productdetails = await Product.findById(productId);

    res.render("productDetails", {
      userId: req.session.user_id ? req.session.user_id : "",
      productdetails,
    });
  } catch (error) {
    console.log(error);
  }
};

const loadCategoryPage = async (req, res) => {
  try {
    const products = await Product.find({ status: true });
    const cata = await category.find({ isListed: true });
    res.render("categoryPage", {
      userId: req.session.user_id ? req.session.user_id : "",
      cata,
      products,
    });
  } catch (error) {
    console.log(error);
  }
};

const loadProfilePage = async (req, res) => {
  try {
    console.log(req.session.user_id);
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    const userData = await User.find();

    const orders = await Order.find({ user: req.session.user_id })
      .populate("products.product")
      .sort({ createdAt: -1 });

    const userAddresses = user.addresses;

    res.render("profilePage", {
      users: userData,
      user: user,
      userId: req.session.user_id ? req.session.user_id : "",
      userAddresses,
      orders,
    });
  } catch (error) {
    console.log(error);
  }
};

const updateUserProfile = async (req, res) => {
  try {
    // Retrieve user details from req.body

    const { name, email, mobile } = req.body;

    // Assuming you have a User model, update the user information
    const userId = req.session.user_id; // Adjust this based on your user model
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, mobile },
      { new: true }
    );

    // Update the user details in the session
    req.session.user = updatedUser;

    // Redirect or send a response indicating success
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadAddAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    res.render("addAddress", {
      userId: req.session.user_id ? req.session.user_id : "",
    });
  } catch (error) {
    console.log(error);
  }
};

const addressAdding = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const {
      addressType,
      houseNo,
      street,
      landmark,
      pincode,
      city,
      district,
      state,
      country,
    } = req.body;

    // Assuming you have a User model with an "addresses" field
    const user = await User.findById(userId);

    // Add the new address to the user's addresses array
    user.addresses.push({
      addressType,
      houseNo,
      street,
      landmark,
      pincode,
      city,
      district,
      state,
      country,
    });
    await user.save();

    // Redirect to the user's profile or address list page
    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadAddressEdit = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const addressId = req.params.addressId;

    // Check if userId is available
    if (!userId) {
      return res.status(401).send("Unauthorized");
    }

    const user = await User.findById(userId);

    // Check if the user object exists and has the 'addresses' property
    if (!user || !user.addresses) {
      return res.status(404).send("User or addresses not found");
    }

    // Find the address in the user's addresses array based on the provided addressId
    const addressToEdit = user.addresses.id(addressId);

    if (!addressToEdit) {
      return res.status(404).send("Address not found");
    }

    res.render("editAddress", {
      address: addressToEdit,
      userId: req.session.user_id ? req.session.user_id : "",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const editingAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;

    // Ensure userId is available
    if (!userId) {
      return res.status(401).send("Unauthorized");
    }

    const user = await User.findById(userId);

    // Ensure user object exists and has the 'addresses' property
    if (!user || !user.addresses) {
      return res.status(404).send("User or addresses not found");
    }

    const addressId = req.params.addressId;

    // Find the address in the user's addresses array based on the provided addressId
    const addressToEdit = user.addresses.id(addressId);

    if (!addressToEdit) {
      return res.status(404).send("Address not found");
    }

    // Update address properties based on the data from the request body
    addressToEdit.addressType = req.body.addressType;
    addressToEdit.houseNo = req.body.houseNo;
    addressToEdit.street = req.body.street;
    addressToEdit.landmark = req.body.landmark;
    addressToEdit.pincode = req.body.pincode;
    addressToEdit.city = req.body.city;
    addressToEdit.district = req.body.district;
    addressToEdit.state = req.body.state;
    addressToEdit.country = req.body.country;

    // Save the updated user object
    await user.save();

    res.redirect("/profile"); // Redirect to the user's profile page after successful update
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const addressdelete = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const addressId = req.params.addressId;

    if (!userId) {
      return res.status(401).send("Unauthorized");
    }

    // Find the user by ID
    const user = await User.findById(userId);

    // Ensure user object exists and has the 'addresses' property
    if (!user || !user.addresses) {
      return res.status(404).send("User or addresses not found");
    }

    // Find the index of the address with the given addressId
    const addressIndex = user.addresses.findIndex(
      (address) => address._id == addressId
    );

    // Check if the address was found
    if (addressIndex === -1) {
      return res.status(404).send("Address not found");
    }

    // Remove the address from the addresses array
    user.addresses.splice(addressIndex, 1);

    // Save the updated user object
    await user.save();

    res.redirect("/profile"); // Redirect to the user's profile page after successful deletion
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadCartPage = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);

    const cart = await Cart.findOne({ user: user._id }).populate(
      "items.product"
    );

    if (cart) {
      cart.items = cart.items.filter((item) => item.product !== null);
      await cart.save();
    }
    res.render("cartPage", {
      cart: cart,
      user: user,
      userId: req.session.user_id ? req.session.user_id : "",
    });
  } catch (error) {
    console.log(error);
  }
};

const addToCart = async (req, res) => {
  try {
    const { id } = req.query;

    const user = req.session.user_id;

    const cart = await Cart.findOne({ user: user });

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ message: "Product not Found" });
    }
    if (cart === null) {
      console.log("found cart nulll === ", new mongoose.Types.ObjectId(id));
      await Cart.insertMany({
        user: user,
        items: [
          {
            product: new mongoose.Types.ObjectId(id),
            quantity: 1,
          },
        ],
      });
    } else {
      const cartItem = cart.items.find((item) => item?.product + "" === id);

      if (cartItem) {
        cartItem.quantity += 1;
      } else {
        cart.items.push({ product: id });
      }

      await cart.save();
    }

    res.status(200).json({ message: "Product add to the Cart", status: true });
  } catch (error) {
    console.log(error);
  }
};

const cartRemoveItem = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const productId = req.body.id;

    //find the user id
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).send("User or cart not found");
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() == productId
    );

    if (itemIndex === -1) {
      return res.status(404).send("Item not found in the cart");
    }

    cart.items.splice(itemIndex, 1);

    await cart.save();

    res.redirect("/cart");
  } catch (error) {
    console.log(error);
    res.status(500).send("internal server error");
  }
};

const cartQuantityInc = async (req, res) => {
  try {
    const userId = req.session.user_id;
    let cart = await Cart.findOne({ user: userId });

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === req.params.id
    );

    // Assuming you have a product model with a 'quantity' field
    const product = await Product.findById(req.params.id);

    // Check if increasing the quantity will exceed the available stock
    if (cart.items[itemIndex].quantity + 1 <= product.quantity) {
      // If not, update the cart
      cart.items[itemIndex].quantity += 1;

      // Save the changes to the parent document (Cart)
      await cart.save();

      res.redirect("/cart");
    } else {
      // If increasing the quantity exceeds the available stock, show an "out of stock" message
      res.redirect("/cart");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const cartQuantityDec = async (req, res) => {
  try {
    const userId = req.session.user_id;
    let cart = await Cart.findOne({ user: userId });
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === req.params.id
    );

    if (cart.items[itemIndex].quantity === 1) {
      cart.items[itemIndex].quantity = 1;

      res.redirect("/cart");
      return;
    }
    cart.items[itemIndex].quantity -= 1;

    // Save the changes to the parent document (Cart)
    await cart.save();

    res.redirect("/cart");
  } catch (error) {
    console.log(error);
  }
};
const loadCheckout = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    const cart = await Cart.findOne({ user: user._id }).populate(
      "items.product"
    );
    const activeCoupons = await Coupon.find({ isActive: true });

    // Calculate orderTotal from the cart
    let orderTotal = 0;
    cart.items.forEach((product) => {
      orderTotal += product.product.offerPrice * product.quantity;
    });

    // Filter valid coupons based on the minimum order amount
    const validCoupons = activeCoupons.filter(
      (coupon) => orderTotal >= coupon.minimumAmount
    );

    res.render("checkoutPage", {
      user,
      cart,
      userId: req.session.user_id ? req.session.user_id : "",
      address: user.addresses,
      coupons: validCoupons,
      orderTotal, // Pass orderTotal to the template
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const checkoutloadAddressEdit = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const addressId = req.params.addressId;

    // Check if userId is available
    if (!userId) {
      return res.status(401).send("Unauthorized");
    }

    const user = await User.findById(userId);

    // Check if the user object exists and has the 'addresses' property
    if (!user || !user.addresses) {
      return res.status(404).send("User or addresses not found");
    }

    // Find the address in the user's addresses array based on the provided addressId
    const addressToEdit = user.addresses.id(addressId);

    if (!addressToEdit) {
      return res.status(404).send("Address not found");
    }

    res.render("checkoutEditAddress", {
      address: addressToEdit,
      userId: req.session.user_id ? req.session.user_id : "",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const checkoutEditingAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;

    // Ensure userId is available
    if (!userId) {
      return res.status(401).send("Unauthorized");
    }

    const user = await User.findById(userId);

    // Ensure user object exists and has the 'addresses' property
    if (!user || !user.addresses) {
      return res.status(404).send("User or addresses not found");
    }

    const addressId = req.params.addressId;

    // Find the address in the user's addresses array based on the provided addressId
    const addressToEdit = user.addresses.id(addressId);

    if (!addressToEdit) {
      return res.status(404).send("Address not found");
    }

    // Update address properties based on the data from the request body
    addressToEdit.addressType = req.body.addressType;
    addressToEdit.houseNo = req.body.houseNo;
    addressToEdit.street = req.body.street;
    addressToEdit.landmark = req.body.landmark;
    addressToEdit.pincode = req.body.pincode;
    addressToEdit.city = req.body.city;
    addressToEdit.district = req.body.district;
    addressToEdit.state = req.body.state;
    addressToEdit.country = req.body.country;

    // Save the updated user object
    await user.save();

    res.redirect("/checkout"); // Redirect to the user's checkout page after successful update
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadcheckoutAddaddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    res.render("checkoutAddaddress", {
      userId: req.session.user_id ? req.session.user_id : "",
    });
  } catch (error) {
    console.log(error);
  }
};

const checkoutaddressAdding = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const {
      addressType,
      houseNo,
      street,
      landmark,
      pincode,
      city,
      district,
      state,
      country,
    } = req.body;

    // Assuming you have a User model with an "addresses" field
    const user = await User.findById(userId);

    // Add the new address to the user's addresses array
    user.addresses.push({
      addressType,
      houseNo,
      street,
      landmark,
      pincode,
      city,
      district,
      state,
      country,
    });
    await user.save();

    // Redirect to the user's profile or address list page
    res.redirect("/checkout");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const razorpay = new Razorpay({
  key_id: "rzp_test_Vz3Fdh1bVQWYj8",
  key_secret: "iqh0x4CGZ2mHJ7CTgrgfvgCo",
});

const placeOrder = async (req, res) => {
  const { selectedAddressId, paymentMethod, total, couponCode } = req.body;
  console.log("Payment Method:", paymentMethod);

  try {
    if (paymentMethod === "cod") {
      // Handle Cash On Delivery (cod) logic
      let products = [];
      const cartItems = await Cart.findOne({ user: req.session.user_id });

      for (let element of cartItems.items) {
        products.push({ product: element.product, quantity: element.quantity });
        const product = await Product.findOne({ _id: element.product });
        let quantity = product.quantity - element.quantity;
        await Product.findByIdAndUpdate(product._id, { quantity });
      }

      const order = new Order({
        user: req.session.user_id,
        address: selectedAddressId,
        paymentMethod,
        products,
        grandTotal: total,
      });

      await order.save();

      await Cart.findByIdAndDelete({ _id: cartItems._id });
      return res.status(200).json({ message: "Order placed successfully." });
    } else if (paymentMethod === "razorpay") {
      console.log("razorpay");
      const options = {
        amount: total * 100,
        currency: "INR",
        receipt: "order_reciept" + Date.now(),
        payment_capture: 1,
      };

      razorpay.orders.create(options, (err, order) => {
        if (err) {
          console.log("Error creating razorpay order:", order);
        }
        console.log("razorpay order created:", order);

        return res.status(201).json({ order });
      });
    } else if (paymentMethod === "wallet") {
      console.log("Processing wallet payment////////////////////");

      let products = [];

      const userId = req.session.user_id;
      const user = await User.findById(userId);
      const cartItems = await Cart.findOne({ user: req.session.user_id });

      for (let element of cartItems.items) {
        products.push({ product: element.product, quantity: element.quantity });
        const product = await Product.findOne({ _id: element.product });
        let quantity = product.quantity - element.quantity;
        await Product.findByIdAndUpdate(product._id, { quantity });
      }

      const userWallet = user.wallet;

      if (total > userWallet) {
        // Insufficient wallet balance
        return res
          .status(501)
          .json({ status: false, message: "Insufficient wallet balance" });
      }

      const cart = await Cart.findOne({ user: userId });

      const orderData = {
        user: userId,
        address: selectedAddressId,
        products: products,
        paymentMethod: paymentMethod,
        grandTotal: total,
      };

      const transaction = {
        amount: total,
        status: "debit",
        reason: "Purchase Using Wallet",
        timestamp: new Date(),
      };

      // Push the transaction into the user's history array
      user.history.push(transaction);

      // Deduct the order amount from the user's wallet
      user.wallet -= total;

      // Save the changes to the user document
      await user.save();

      // Save the order document
      const insertOrder = await Order.create(orderData);
      await Cart.findByIdAndDelete({ _id: cartItems._id });
      if (insertOrder) {
        console.log("Order added successfully");
        return res.status(200).json({ status: true });
      }
    } else {
      // Handle other payment methods if needed
      return res.status(400).json({ error: "Invalid payment method" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const placeOrderRaz = async (req, res) => {
  try {
    const { selectedAddressId, paymentMethod, total } = req.body;

    let products = [];
    const cartItems = await Cart.findOne({ user: req.session.user_id });

    for (let element of cartItems.items) {
      products.push({ product: element.product, quantity: element.quantity });
      const product = await Product.findOne({ _id: element.product });
      let quantity = product.quantity - element.quantity;

      total: element.price * element.quantity;

      await Product.findByIdAndUpdate(product._id, { quantity });
    }

    const order = new Order({
      user: req.session.user_id,
      address: selectedAddressId,
      paymentMethod,
      products,
      grandTotal: total,
    });

    await order.save();

    await Cart.findByIdAndDelete({ _id: cartItems._id });

    // Redirect to the orders page after successfully placing the order
    res.status(201).json({ order: order.toObject() }); // Assuming you send a response back to the client
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const loadOrdersPage = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.user_id })
      .populate("products.product")
      // .populate('address')
      .sort({ createdAt: -1 });

    res.render("ordersPage", {
      userId: req.session.user_id ? req.session.user_id : "",
      orders,
    });
  } catch (error) {
    console.log(error);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: "Cancelled" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Iterate through order items and update product stock
    for (const item of order.products) {
      const product = await Product.findById(item.product);

      if (product) {
        // Increment the product stock by the canceled quantity
        product.quantity += item.quantity;
        await product.save();
      }
    }

      // Find the user in the session
      const userId = req.session.user_id;
      
      const user = await User.findById(userId);
      
      
      if (user) {

        console.log(user.wallet,'/////////');
        console.log(order.grandTotal,"{{{{{{{}}}}}}}}}}}}");

        if (order.paymentMethod !== "cod") {
          // Increase the user's wallet by the order's total amount
          user.wallet += order.grandTotal;
          await user.save();
          console.log('SUCCESSFULLY RETURN CASH TO WALLET');
        }

      
      }

      console.log('COD CANCLE');

    // Respond to the client after the stock update is complete
    res.json({ message: "Order cancelled successfully", order });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if required fields are present in the request body
    if (!email) {
      return res.status(400).send("Missing required fields");
    }

    const user = new User({
      email: email,
    });

    await user.save();

    req.session.otp = sendPasswordResetLink(user.email);
    req.session.userData = user;

    res.redirect("/admin/forgotpassOtp");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const forgotpassOtpPage = async (req, res) => {
  if (req.session.userData) {
    res.render("forgotpassOtp");
  } else {
    res.redirect("/profile");
  }
};

const loadforgotPass = async (req, res) => {
  try {
    res.render("forgotpassOtp");
  } catch (error) {
    console.log(error);
  }
};

const forgotEmailInput = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.find({ email: email });
    req.session.forgotReqEmail = email;
    if (user.length === 0) {
      res.send({
        sucess: false,
        message: "No user found",
      });
      return;
    }
    req.session.otp = sendOtp(email);
    res.send({
      sucess: true,
      message: "",
    });
    console.log(req.session.otp);
  } catch (error) {
    console.log(error);
  }
};
const verifyForgotOTP = async (req, res) => {
  try {
    const otp = req.body.otp;

    if (otp !== req.session.otp) {
      res.send({
        sucess: false,
        message: "OTP not matching",
      });
      return;
    }
    res.send({
      sucess: true,
      message: "",
    });
  } catch (err) {
    res.send({
      sucess: false,
      message: "Something Went wrong",
    });
  }
};
const addNewPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const user = await User.findOne({ email: req.session.forgotReqEmail });
    await User.findByIdAndUpdate(user._id, {
      password,
    });
    res.send({
      sucess: true,
      message: "",
    });
  } catch (err) {
    console.log(err);
    res.send({
      sucess: false,
      message: "Something went wrong",
    });
  }
};

const loadhomeProduct = async (req, res) => {
  try {
    let user = { name: "For better experience, please login" };
    if (req.session) {
      const userId = req.session.user_id;
      user = await User.findOne({ _id: userId });
    }

    const productsPerPage = 12; // Number of products per page
    const currentPage = req.query.page || 1;

    // Retrieve category filter from the request query
    const categoryFilter = req.query.category || "All Categories";

    // Find all categories
    const cata = await category.find();

    // Adjust the category query based on the filter
    const categoryQuery =
      categoryFilter !== "All Categories" ? { category: categoryFilter } : {};

    // Count total products based on category filter
    const totalProducts = await Product.countDocuments({
      status: true,
      ...categoryQuery,
    });

    // Calculate total pages based on total products and products per page
    const totalPages = Math.ceil(totalProducts / productsPerPage);

    // Calculate the skip value for pagination
    const skip = (currentPage - 1) * productsPerPage;

    // Retrieve products based on category filter, skipping, and limiting
    const products = await Product.find({ status: true, ...categoryQuery })
      .sort({ offerPrice: 1 })
      .skip(skip)
      .limit(productsPerPage);

    res.render("shop", {
      userId: req.session.user_id ? req.session.user_id : "",
      products,
      cata,
      userName: user.name,
      currentPage,
      totalPages,
      categoryFilter,
    });
  } catch (error) {
    console.log(error);
  }
};

const cancelItem = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const productId = req.params.productId;

    // Fetch the order by ID
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find the index of the product in the order's products array
    const productIndex = order.products.findIndex(
      (product) => product._id.toString() === productId
    );

    if (productIndex === -1) {
      return res
        .status(404)
        .json({ message: "Product not found in the order" });
    }

    // Get the canceled product and update the product stock
    const canceledProduct = order.products.splice(productIndex, 1)[0];
    const updatedProduct = await Product.findById(canceledProduct.product);

    if (updatedProduct) {
      updatedProduct.quantity += canceledProduct.quantity;
      await updatedProduct.save();
    }

    // Save the updated order
    await order.save();

    res.json({ message: "Item cancelled successfully", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const loadUserOrderDetailsPage = async (req, res) => {
  try {
    // const usersData = await User.find({ is_admin: 0 }).sort({ name: 1 });
    const order = await Order.findById(req.query.id)
      .populate("user")
      .populate("products.product");

    res.render("orderDetails", {
      order,
      userId: req.session.user_id ? req.session.user_id : "",
    });
  } catch (error) {
    console.log(error);
  }
};

const searchProduct = async (req, res, next) => {
  try {
    const filter = req.query.q;

    if (filter != "") {
      const regex = new RegExp(filter, "i");
      const products = await Product.find({ name: { $regex: regex } });

      if (products) {
        res.json(products);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const invoice = async (req, res) => {
  try {
    const user = await User.findById(req.session.user_id);
    const order = await Order.findById(req.query.id).populate("user");

    if (order) {
      res.render("invoice", {
        order,
        user,
        userId: req.session.user_id ? req.session.user_id : "",
      });
    }
  } catch (error) {
    console.log(
      "Error hapence in invoice controller in the funtion invoice",
      error
    );
  }
};

const invoiceDownload = async (req, res) => {
  try {
    const id = req.query.id;

    const userId = req.session.user_id;
    const result = await Order.findById({ _id: id })
      .populate("user")
      .populate("products.product");
    // Extract the user's address based on the Order's address ID

    const user = await User.findById({ _id: userId });

    if (!result || !result.address) {
      return res
        .status(404)
        .json({ error: "Order not found or address missing" });
    }

    const order = {
      id: id,
      total: result.grandTotal,
      date: result.createdAt, // Use the formatted date
      paymentMethod: result.paymentMethod,
      orderStatus: result.status,
      name: result.user.name,
      mobile: result.user.mobile,
      house: result.address.street,
      pincode: result.address.pincode,
      city: result.address.city,
      state: result.address.state,
      products: result.products,
    };

    // Assuming products is an array, adjust if needed
    const products = order.products.map((product) => ({
      quantity: parseInt(product.quantity),
      description: product.product.name,
      price: parseInt(product.product.offerPrice),
      total: parseInt(result.grandTotal),
      "tax-rate": 0,
    }));

    const isoDateString = order.date;
    const isoDate = new Date(isoDateString);

    const options = { year: "numeric", month: "long", day: "numeric" };
    const formattedDate = isoDate.toLocaleDateString("en-US", options);
    const data = {
      customize: {
        //  "template": fs.readFileSync('template.html', 'base64') // Must be base64 encoded html
      },
      images: {
        // The invoice background
        background: "",
      },
      // Your own data
      sender: {
        company: "WatchVogue",
        address: "Discover our watch collection",
        city: "Ernakulam",
        country: "India",
      },
      client: {
        company: "Customer Address",
        zip: order.name,
        city: order.city,
        address: order.pincode,
        // "custom1": "custom value 1",
        // "custom2": "custom value 2",
        // "custom3": "custom value 3"
      },
      information: {
        number: "order" + order.id,
        date: formattedDate,
      },
      products: products,
      "bottom-notice": "Happy shoping and visit again",
    };

    let pdfResult = await easyinvoice.createInvoice(data);
    const pdfBuffer = Buffer.from(pdfResult.pdf, "base64");

    // Set HTTP headers for the PDF response
    res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
    res.setHeader("Content-Type", "application/pdf");

    // Create a readable stream from the PDF buffer and pipe it to the response
    const pdfStream = new Readable();
    pdfStream.push(pdfBuffer);
    pdfStream.push(null);
    pdfStream.pipe(res);
  } catch (error) {
    console.error("Error in invoiceDownload:", error);
    res.status(500).json({ error: error.message });
  }
};

const validateCoupon = async (req, res) => {
  try {
    const { code, total } = req.body;
    console.log("Received coupon code:", code);
    console.log(total, "????????????>");

    // Find the coupon in the database based on the provided code
    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
      // Coupon not found
      return res
        .status(200)
        .json({ success: false, message: "Coupon not found" });
    }

    // Check if the coupon is still active
    if (!coupon.isActive) {
      return res
        .status(200)
        .json({ success: false, message: "Coupon is not active" });
    }

    // Check if the coupon has expired
    const currentDate = new Date();
    if (coupon.expirationDate < currentDate) {
      return res
        .status(200)
        .json({ success: false, message: "Coupon has expired" });
    }

    // Check if the user has already used the coupon
    const userIdd = req.session.user_id;
    if (coupon.usedBy.includes(userIdd)) {
      return res
        .status(200)
        .json({
          success: false,
          message: "Coupon has already been used by this user",
        });
    }

    // Fetch the order associated with the user (assuming the order is tied to the user)
    const userId = req.session.user_id; // Update this based on your user identification logic
    // const order = await Order.findOne({ user: userId }).populate('products.product');

    // if (!order) {
    //   return res.status(200).json({ success: false, message: 'No pending order found for the user' });
    // }

    // Get the total order amount from the grandTotal field
    const orderTotal = total;

    // Check if the order total meets the minimum amount required for the coupon
    if (orderTotal < coupon.minimumAmount) {
      return res
        .status(200)
        .json({
          success: false,
          message:
            "Order total does not meet the minimum amount required for the coupon",
        });
    }

    // Mark the coupon as used by the user
    coupon.usedBy.push(userId);
    await coupon.save();

    const discountPercentage = coupon.discountPercentage;
    const discountedTotal =
      orderTotal - orderTotal * (discountPercentage / 100);
    console.log(discountPercentage, "//////");
    console.log(discountedTotal, ">>>>>>>>>");
    console.log(coupon.discountPercentage, "//////");
    // Update the order with the discounted total

    return res.status(200).json({ success: true, discountedTotal });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const addWallet = async (req, res) => {
  try {
    const amount = req.body.amount;
    console.log(amount);

    var options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "order_receipt_" + Date.now(),
      payment_capture: 1,
    };

    razorpay.orders.create(options, (err, data) => {
      if (err) {
        console.error("Razorpay order creation failed:", err.message);
        return res
          .status(500)
          .json({ status: false, message: "Razorpay order creation failed" });
      }

      return res.status(200).json({ order: data });
    });
  } catch (error) {
    console.log(error);
  }
};

const updateWallet = async (req, res) => {
  try {
    console.log("Inside updateWallet function");
    const userId = req.session.user_id;
    const { amount } = req.body; // Destructure amount directly from req.body

    const updatewallet = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { wallet: amount },
        $push: {
          history: {
            amount: amount,
            status: "credit",
            reason: "Add Cash to Wallet",
            timestamp: Date.now(),
          },
        },
      },
      { new: true }
    );

    if (updatewallet) {
      res.status(200).json({});
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getreferal = async (req, res) => {
  try {
    console.log("Called referal server");
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    console.log(user);
    const referalCode = user.referalCode;
    console.log(referalCode, "//////");

    if (referalCode) {
      res.json({ referalCode });
    } else {
      console.log("Dond get referalCode");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  addNewPassword,
  verifyForgotOTP,
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
  loadCategoryPage,
  loadProfilePage,
  updateUserProfile,
  loadAddAddress,
  addressAdding,
  loadAddressEdit,
  editingAddress,
  addressdelete,
  loadCartPage,
  addToCart,
  cartRemoveItem,
  cartQuantityInc,
  cartQuantityDec,
  loadCheckout,
  checkoutloadAddressEdit,
  checkoutEditingAddress,
  loadcheckoutAddaddress,
  checkoutaddressAdding,
  placeOrder,
  placeOrderRaz,
  loadOrdersPage,
  cancelOrder,
  forgotPassword,
  forgotpassOtpPage,
  loadforgotPass,
  forgotEmailInput,
  loadhomeProduct,
  cancelItem,
  resendOtp,
  loadUserOrderDetailsPage,
  searchProduct,
  invoice,
  invoiceDownload,
  validateCoupon,
  addWallet,
  updateWallet,
  getreferal,
};
