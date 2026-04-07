const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin:perfloplast2025@cluster0.btrer.mongodb.net/dcarmen?retryWrites=true&w=majority').then(async () => {
  const Product = require('./models/Product');
  const result = await Product.updateMany({}, { $set: { 'colors.$[].textureTransform.scale': 1, 'colors.$[].textureTransform.x': 0, 'colors.$[].textureTransform.y': 0 } });
  console.log('Fixed all texture scales to 1.0', result);
  process.exit(0);
}).catch(console.error);
