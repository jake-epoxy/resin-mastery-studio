const Jimp = require("jimp");

async function main() {
  const image = await Jimp.read("extracted.jpg");
  console.log("Width:", image.bitmap.width);
  console.log("Height:", image.bitmap.height);
}
main();
