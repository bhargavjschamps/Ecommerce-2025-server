import { Product } from "../models/Product.js";
import bufferGenerator from "../utils/bufferGenerator.js";
import TryCatch from "../utils/TryCatch.js";
import cloudinary from "cloudinary";

export const createProduct = TryCatch(async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({
      message: "You are not admin",
    });

  const { title, description, category, price, stock } = req.body;
  const files = req.files;

  if (!files || files.length === 0)
    return res.status(400).json({
      message: "no files to upload",
    });

  // ✅ Convert price & stock into numbers
  const cleanPrice = Number(price.toString().replace(/,/g, ""));
  const cleanStock = Number(stock.toString().replace(/,/g, ""));

  if (isNaN(cleanPrice) || isNaN(cleanStock)) {
    return res.status(400).json({ message: "Invalid price or stock value" });
  }

  const imageUploadPromises = files.map(async (file) => {
    const fileBuffer = bufferGenerator(file);
    const result = await cloudinary.v2.uploader.upload(fileBuffer.content);

    return {
      id: result.public_id,
      url: result.secure_url,
    };
  });

  const uploadImage = await Promise.all(imageUploadPromises);

  const product = await Product.create({
    title,
    description,
    category,
    price: cleanPrice, // ✅ store number
    stock: cleanStock, // ✅ store number
    images: uploadImage,
  });

  res.status(201).json({
    message: "Product created",
    product,
  });
});


export const getAllProducts = TryCatch(async (req, res) => {
  const { search, category, page, sortByPrice } = req.query;

  const filter = {};

  if (search) {
    filter.title = {
      $regex: search,
      $options: "i",
    };
  }

  if (category) {
    filter.category = category;
  }

  const limit = 8;
  const currentPage = parseInt(page) || 1;
  const skip = (currentPage - 1) * limit;

  let sortOptions = { createdAt: -1 };

  if (sortByPrice) {
    if (sortByPrice === "lowToHigh") {
      sortOptions = { price: 1 };
    } else if (sortByPrice === "highToLow") {
      sortOptions = { price: -1 };
    }
  }

  const products = await Product.find(filter)
    .sort(sortOptions)
    .limit(limit)
    .skip(skip);

  const categories = await Product.distinct("category");
  const newProduct = await Product.find().sort({ createdAt: -1 }).limit(4);
  const countProduct = await Product.countDocuments(filter);
  const totalPages = Math.ceil(countProduct / limit);

  res.json({
    products,
    categories,
    totalPages,
    newProduct,
  });
});

export const getSingleProduct = TryCatch(async (req, res) => {
  const product = await Product.findById(req.params.id);

  const relatedProduct = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
  }).limit(4);

  res.json({ product, relatedProduct });
});

export const updateProduct = TryCatch(async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({
      message: "You are not admin",
    });

  const { title, description, category, price, stock } = req.body;

  const updateFields = {};

  if (title) updateFields.title = title;
  if (description) updateFields.description = description;
  if (category) updateFields.category = category;
  if (price) updateFields.price = price;
  if (stock) updateFields.stock = stock;

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    updateFields,
    { new: true, runValidators: true }
  );

  if(!updatedProduct)
    return res.status(404).json({
    message:'product not found'
    })

    res.json({
      message:'product updated',
      updatedProduct
    })
});


export const updateProductImage = TryCatch(async(req ,res)=>{
  if (req.user.role !== "admin")
    return res.status(403).json({
      message: "You are not admin",
    });

    const {id} = req.params
    const files = req.files
  
      if (!files || files.length === 0)
    return res.status(400).json({
      message: "no files to upload",
    });

    const product = await Product.findById(id)

    if(!product)
       return res.status(404).json({
    message:'product not found'
    })

    const oldImages = product.images || [];
    for(const img of oldImages){
      if(img.id){
        await cloudinary.v2.uploader.destroy(img.id)
      }
    }
 const imageUploadPromises = files.map(async (file) => {
    const fileBuffer = bufferGenerator(file);

    const result = await cloudinary.v2.uploader.upload(fileBuffer.content);

    return {
      id: result.public_id,
      url: result.secure_url,
    };
  });

  const uploadImage = await Promise.all(imageUploadPromises);

  product.images = uploadImage

  await product.save()

  res.status(200).json({
    message:'image updated',
    product
  })

})