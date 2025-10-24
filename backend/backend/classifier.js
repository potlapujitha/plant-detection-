// classifier.js
const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const sharp = require('sharp');

let modelPromise = null;

async function loadModel() {
  if (!modelPromise) modelPromise = mobilenet.load({ version: 2, alpha: 1.0 });
  return modelPromise;
}

/**
 * decodeBufferToTensor - returns a tensor suitable for mobilenet.classify
 */
async function decodeBufferToTensor(buffer) {
  // sharp to decode to raw RGB and create tensor
  const image = sharp(buffer).resize(224, 224, { fit: 'cover' }).removeAlpha();
  const raw = await image.raw().toBuffer({ resolveWithObject: true });
  const { data, info } = raw; // data = Buffer of RGBRGB...
  const tensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, info.channels], 'int32');
  const expanded = tensor.expandDims(0).toFloat().div(255);
  return expanded;
}

/**
 * classifyImage(buffer) -> {predictions: [...], isPlant: bool, species, confidence}
 */
async function classifyImage(buffer) {
  const model = await loadModel();
  // mobilenet.classify accepts image element or tensor 3D/4D
  const tensor = await decodeBufferToTensor(buffer);
  const predictions = await model.classify(tensor); // array of {className, probability}
  tensor.dispose();

  // simple plant label set (common plant/flower labels mobileNet includes)
  const plantKeywords = [
    'plant', 'flower', 'tree', 'leaf', 'fern', 'cactus', 'pine', 'oak', 'maple',
    'rose', 'daisy', 'sunflower', 'orchid', 'tulip', 'lotus', 'marigold', 'dandelion',
    'bell pepper', 'banana' // some fruit images might be in mobilenet labels
  ];

  // Decide if any top predictions indicate plant
  let isPlant = false;
  let bestPlantPrediction = null;

  for (const p of predictions) {
    const name = p.className.toLowerCase();
    for (const kw of plantKeywords) {
      if (name.includes(kw)) {
        isPlant = true;
        if (!bestPlantPrediction || p.probability > bestPlantPrediction.probability) {
          bestPlantPrediction = p;
        }
        break;
      }
    }
  }

  const species = bestPlantPrediction ? bestPlantPrediction.className : null;
  const confidence = bestPlantPrediction ? bestPlantPrediction.probability : (predictions[0] ? predictions[0].probability : 0);

  return {
    predictions, // raw predictions from MobileNet
    isPlant,
    species,
    confidence
  };
}

module.exports = { classifyImage };
