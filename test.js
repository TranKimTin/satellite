const Jimp = require('jimp');

async function crop() { // Function name is same as of file name
    // Reading Image
    const image = await Jimp.read('./test.jpg');
    image.crop(1000, 2000, 1000, 2000)
        .write('./crop.jpg');
}

crop(); // Calling the function here using async
console.log("Image is processed successfully");