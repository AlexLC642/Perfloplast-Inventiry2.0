const cloudinary = require('cloudinary').v2;

// NEW values provided by the user
const config = {
  cloud_name: 'dnnztpv9w',
  api_key: '444395252463268',
  api_secret: 'nbpyqobaqInDSga2zYqEs9ercB0', // Corrected Secret
  secure: true
};

console.log('--- Testing Corrected Vars ---');
console.log('Cloud Name:', config.cloud_name);
console.log('API Key:', config.api_key);

cloudinary.config(config);

const testUpload = async () => {
  try {
    const result = await cloudinary.uploader.upload('https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png', {
      folder: 'test-connection-final'
    });
    console.log('✅ TEST SUCCESSFUL!');
    console.log('Public ID:', result.public_id);
    console.log('URL:', result.secure_url);
  } catch (error) {
    console.error('❌ TEST FAILED!');
    console.error('Error Detail:', error);
  }
};

testUpload();
