const category = require("../models/category");

const User = require("../models/userModel");
const { Product } = require("../models/product");
const Admin = require("../models/adminModel");

const loadLogin = async (req, res) => {
  try {
    res.render("login", { message: "" });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyAdmin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const adminData = await Admin.findOne({ email: email });

    if (adminData) {
      if (adminData.password === password) {
        if (adminData.is_admin === true) {
          res.render("login", { message: "Invalid Admin" });
        } else {
          req.session.admin_id = adminData._id;
          res.redirect("/admin/home");
        }
      } else {
        res.render("login", { message: "Invalid Admin" });
      }
    } else {
      res.render("login", { message: "Invalid Admin" });
    }
  } catch (error) {
    console.log(error.message);
  }
};



const logout = async (req, res) => {
  try {
    req.session.admin_id = null;
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

const loadDashboard = async (req, res) => {
  try {
    const usersData = await User.find({ is_admin: 0 }).sort({ name: 1 });
    res.render("dashboard", { users: usersData });
  } catch (error) {
    console.log(error.message);
  }
};

const loadUserlist = async (req, res) => {
  try {
    const usersData = await User.find({ is_admin: 0 }).sort({ name: 1 });
    res.render("userList", { users: usersData });
  } catch (error) {
    console.log(error.message);
  }
};

const loadAddUser = async (req, res) => {
  try {
    res.render("newUser", { message: "", errMessage: "" });
  } catch (error) {
    console.log(error.message);
  }
};

const addUser = async (req, res) => {
  try {
    const checkData = await User.findOne({ email: req.body.email });
    if (checkData) {
      res.render("newUser", {
        message: "",
        errMessage: "User already founded",
      });
    } else {
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        password: req.body.password,
      });

      const userData = await user.save();
      if (userData) {
        res.redirect("/admin/dashboard");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const editUserLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("editUser", { user: userData });
    } else {
      res.redirect("/admin/dashboard");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mobile,
        },
      }
    );
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    const userData = await User.findOneAndRemove({ _id: req.query.id });
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

const searchUser = async (req, res) => {
  try {
    const name = req.body.name;
    const usersData = await User.find({
      is_admin: 0,
      name: { $regex: name, $options: "i" },
    }).sort({ name: 1 });
    res.render("dashboard", { users: usersData });
  } catch (error) {
    console.log(error.message);
  }
};

const block = async (req, res) => {
  try {
    const userId = req.query.id;
    const blockUser = await User.findByIdAndUpdate(userId, { isBlocked: true });
    if (blockUser) {
      res.redirect("/admin/userlist"); // Redirect to the user list page
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.log(error);
  }
};

const unblock = async (req, res) => {
  try {
    const userId = req.query.id;
    const unblockUser = await User.findByIdAndUpdate(userId, {
      isBlocked: false,
    });
    if (unblockUser) {
      res.redirect("/admin/userlist"); // Redirect to the user list page
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.log(error);
  }
};

const loadCategory = async (req, res) => {
  try {
    const usersCategory = await category.find();
    console.log("usersCategory");

    res.render("categoryList", { category: usersCategory });
  } catch (error) {
    console.log(error.message);
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    console.log(req.body.name);
    console.log(req.body.description);
    const NameRegex = new RegExp(name, "i");

    const checkData = await category.findOne({ name: { $regex: NameRegex } });

    if (checkData) {
      const errMessage = "Category alredy exists";
      res.redirect(
        `/admin/createCategory?error=${encodeURIComponent(errMessage)}`
      );
    } else {
      const newCategory = new category({
        name: name,
        description: description,
      });

      const saveData = await newCategory.save();
      if (saveData) {
        res.redirect("/admin/category");
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Sever Error");
  }
};

const blockCategory = async (req, res) => {
  try {
    const categoryId = req.query.id;

    const blocked = await category.findByIdAndUpdate(categoryId, {
      isListed: false,
    });

    if (blocked) {
      res.redirect("/admin/category");
    } else {
      res.status(404).send("User Not Found");
    }
  } catch (error) {
    console.log(error);
  }
};

const unBlockCategory = async (req, res) => {
  try {
    const categoryId = req.query.id;

    const unblocked = await category.findByIdAndUpdate(categoryId, {
      isListed: true,
    });

    if (unblocked) {
      res.redirect("/admin/category");
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.log(error);
  }
};

const editcat = async (req, res, next) => {
  try {
    const categoryId = req.query.id;
    console.log(req.query.id);
    const categoryData = await category.findById(categoryId); // Use the renamed variable
    if (!categoryData) {
      return res.status(404).send("Category not found");
    } else {
      res.render("editcategory", { category: categoryData }); // Use the renamed variable
    }
  } catch (error) {
    console.log(error);
  }
};

const posteditCat = async (req, res) => {
  try {
    const Category = await category.findByIdAndUpdate(req.body.id, {
      $set: { name: req.body.name, description: req.body.description },
    });
    res.redirect("/admin/category");

   
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadProduct = async (req, res) => {
  try {
    const products = await Product.find();

    res.render("productList", { products });
  } catch (error) {
    console.log(error);
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const cata = await category.find({ isListed: true });
    res.render("addProduct", { cata });
  } catch (error) {
    console.log(error);
  }
};



const productadding = async (req, res) => {
  try {
    console.log(req.body);
    const prod = await Product.find();
    console.log(prod);

    const newProduct = new Product({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      brand: req.body.brand,
      quantity: req.body.quantity,
      coverimage: "/products/" + req.session.images[0],
      images: [
        "/products/" + req.session.images[1],
        "/products/" + req.session.images[2],
        "/products/" + req.session.images[3],
      ],
    });

    await newProduct.save();
    req.session.images = null;

    res.redirect("/admin/productList?change=true");
  } catch (error) {
    console.log(error);
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const productId = req.query.id;
    const products = await Product.findById(productId);

    const cata = await category.find({ isListed: true });

    res.render("editProduct", { products, cata });
  } catch (error) {
    console.log(error);
  }
};

const editProduct = async (req, res) => {
  try {
    const products = await Product.findByIdAndUpdate(req.body.id, {
      $set: {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        brand: req.body.brand,
        quantity: req.body.quantity,
        coverimage: req.body.coverimage,
        images: req.body.images,
      },
    });
    res.redirect("/admin/productList");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const productUnlist = async (req, res) => {
  try {
    const productId = req.query.id;
    const unBlockProduct = await Product.findByIdAndUpdate(productId, {
      status: true,
    });

    if (unBlockProduct) {
      res.redirect("/admin/productlist");
    } else {
      res.status(404).send("User not Found");
    }
  } catch (error) {
    console.log(error);
  }
};

const productList = async (req, res) => {
  try {
    const productId = req.query.id;
    const blockProduct = await Product.findByIdAndUpdate(productId, {
      status: false,
    });

    if (blockProduct) {
      res.redirect("/admin/productlist");
    } else {
      res.status(404).send("user not Found");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loadLogin,
  verifyAdmin,
  loadUserlist,
  logout,
  loadDashboard,
  loadAddUser,
  addUser,
  editUserLoad,
  updateUser,
  deleteUser,
  searchUser,
  block,
  unblock,
  loadCategory,
  createCategory,
  blockCategory,
  unBlockCategory,
  editcat,
  posteditCat,
  loadProduct,
  loadAddProduct,
  productadding,
  loadEditProduct,
  editProduct,
  productUnlist,
  productList,
};
