let uploadedImage; // This variable will hold the uploaded image
let isLoading = false; // Track if the image is loading
let result;
let scale = 0.005; // Noise scale for flow
let numStrands = 10000; // Initial number of strands
let maxStrandLength = 200; // Maximum strand length
let glowIntensity = 1.0; // Initial glow intensity
let strandThickness = 0.8; // Initial strand thickness
let contrast = 1.0; // Contrast level
let isLocked = false; // Frame lock flag
let showInfo = true; // Toggle display of parameter values
let noiseType = 0; // 0 = Perlin, 1 = Simplex, 2 = Worley, 3 = Fractal Perlin
let isInverted = false; // Toggle for scene inversion
let animateNoise = false; // Toggle for animated noise
let noiseZ = 0.0; // Z-axis for animated noise
let lastResult; // Store the last generated result

function setup() {
  createCanvas(800, 800);
}

function draw() {
  background(255); // Clear canvas (set to white)

  // Check if the uploaded image is available
  if (uploadedImage) {
    // Draw the uploaded image to the canvas
    image(uploadedImage, 0, 0, width, height);
    
    // Only generate new strands if not locked
    if (!isLocked || !lastResult) {
      generateStrands();
      lastResult = result; // Store the result
    } else {
      // Use the stored result when locked
      image(lastResult, 0, 0);
    }
  }

  // Always draw the UI on top with proper transparency
  if (showInfo) {
    displayInfo();
  }
}

function generateStrands() {
  let strandLength = map(mouseY, 0, height, 10, maxStrandLength); // Map Y-axis to strand length
  glowIntensity = map(mouseX, 0, width, 0.5, 3.0); // Map X-axis to glow intensity

  result = createGraphics(width, height);
  result.background(isInverted ? 255 : 0); // Background inversion
  result.strokeWeight(strandThickness); // Set strand thickness
  result.noFill();

  for (let i = 0; i < numStrands; i++) {
    let x = random(width);
    let y = random(height);
    let strandColor = uploadedImage.get(x, y); // Get color from the uploaded image

    // Apply contrast and inversion
    strandColor = color(
      constrain((red(strandColor) - 128) * contrast + 128, 0, 255),
      constrain((green(strandColor) - 128) * contrast + 128, 0, 255),
      constrain((blue(strandColor) - 128) * contrast + 128, 0, 255)
    );
    if (isInverted) {
      strandColor = color(255 - red(strandColor), 255 - green(strandColor), 255 - blue(strandColor));
    }

    let points = [];
    let prevAngle = 0;
    for (let j = 0; j < strandLength; j++) {
      let angle = lerp(prevAngle, getNoise(x * scale, y * scale, noiseZ) * TWO_PI * 2, 0.5);
      prevAngle = angle;
      let dx = cos(angle);
      let dy = sin(angle);
      x += dx;
      y += dy;

      points.push(createVector(x, y));
      if (x < 0 || x >= width || y < 0 || y >= height) break;
    }

    result.beginShape();
    for (let j = 0; j < points.length; j++) {
      let point = points[j];
      let blendedColor = color(
        red(strandColor),
        green(strandColor),
        blue(strandColor),
        255 * map(j, 0, points.length, glowIntensity, 0.3)
      );
      result.stroke(blendedColor);
      result.curveVertex(point.x, point.y);
    }
    result.endShape();
  }

  image(result, 0, 0); // Draw the strands on top of the uploaded image
}

function getNoise(x, y, z) {
  switch (noiseType) {
    case 0: return noise(x, y, z);
    case 1: return (sin(x) * cos(y) + 1) / 2;
    case 2: return worleyNoise(x, y);
    case 3: return fractalPerlin(x, y, z);
    default: return noise(x, y, z);
  }
}

function worleyNoise(x, y) {
  let minDist = 1.0;
  for (let i = 0; i < 5; i++) {
    let px = random(width) * scale * 10;
    let py = random(height) * scale * 10;
    let distToPoint = dist(x, y, px, py);
    minDist = min(minDist, distToPoint);
  }
  return map(minDist, 0, 1, 0, 1);
}

function fractalPerlin(x, y, z) {
  let sum = 0.0;
  let freq = 1.0;
  let amp = 0.5;
  for (let i = 0; i < 4; i++) {
    sum += amp * noise(x * freq, y * freq, z * freq);
    freq *= 2.0;
    amp *= 0.5;
  }
  return sum;
}

function displayInfo() {
  let info = [
    `Noise Type (←/→): ${getNoiseTypeName()}`,
    `Noise Scale (↑/↓): ${nf(scale, 1, 3)}`,
    `Noise Animation (A): ${animateNoise ? "ON" : "OFF"}`,
    `Strand Length (Y-axis): ${nf(map(mouseY, 0, height, 10, maxStrandLength), 1, 1)}`,
    `Strand Amount (< / >): ${numStrands}`,
    `Strand Thickness (1-9): ${nf(strandThickness, 1, 1)}`,
    `Glow Intensity (X-axis): ${nf(map(mouseX, 0, width, 0.5, 5.0), 1, 1)}`,
    `Contrast (C): ${nf(contrast, 1, 1)}`,
    `Inverted Scene (I): ${isLocked ? "DISABLED (Frozen)" : isInverted ? "YES" : "NO"}`,
    `Freeze Frame (F): ${isLocked ? "YES" : "NO"}`,
    `Export Image (E)`,
    `Reset (R)`,
    `Toggle UI (U)`
  ];

  let boxWidth = 0;
  let boxHeight = info.length * 20 + 10;
  textSize(16);
  textAlign(LEFT, TOP);
  for (let line of info) {
    boxWidth = max(boxWidth, textWidth(line) + 20);
  }

  push();
  fill(isInverted ? 255 : 0, 150);
  noStroke();
  rect(5, 5, boxWidth, boxHeight, 10);

  fill(isInverted ? 0 : 255);
  let yOffset = 10;
  for (let line of info) {
    text(line, 15, yOffset);
    yOffset += 20;
  }
  pop();
}

function getNoiseTypeName() {
  switch (noiseType) {
    case 0: return "Perlin";
    case 1: return "Simplex";
    case 2: return "Worley";
    case 3: return "Fractal Perlin";
    default: return "Unknown";
  }
}

function keyPressed() {
  if (key === 'e' || key === 'E') {
    saveCanvas('output', 'png');
    console.log('Frame saved as PNG.');
  }

  if (key === 'u' || key === 'U') {
    showInfo = !showInfo;
  }

  if (key === 'a' || key === 'A') {
    animateNoise = !animateNoise;
  }

  if (key === 'f' || key === 'F') {
    isLocked = !isLocked;
  }

  if (keyCode === UP_ARROW) {
    scale = min(0.01, scale + 0.001);
  } else if (keyCode === DOWN_ARROW) {
    scale = max(0.001, scale - 0.001);
  }

  if (key === ',') {
    numStrands = max(500, numStrands - 500);
  } else if (key === '.') {
    numStrands = min(50000, numStrands + 500);
  }

  if (key === 'c' || key === 'C') {
    contrast += 0.1;
    if (contrast > 3.0) {
      contrast = 0.5;
    }
  }

  if (key >= '1' && key <= '9') {
    strandThickness = map(key - '0', 1, 9, 0.1, 3.0);
  }

  if (key === 'i' || key === 'I') {
    if (!isLocked) {
      isInverted = !isInverted;
    } else {
      console.log('Invert disabled while frozen.');
    }
  }

  if (keyCode === LEFT_ARROW) {
    noiseType = (noiseType - 1 + 4) % 4;
  } else if (keyCode === RIGHT_ARROW) {
    noiseType = (noiseType + 1) % 4;
  }

  if (key === 'r' || key === 'R') {
    resetSketch();
  }
}

function resetSketch() {
  uploadedImage = null;
  isLoading = false;
  result = null;
  scale = 0.005;
  numStrands = 10000;
  maxStrandLength = 200;
  glowIntensity = 1.0;
  strandThickness = 0.8;
  contrast = 1.0;
  isLocked = false;
  showInfo = true;
  noiseType = 0;
  isInverted = false;
  animateNoise = false;
  noiseZ = 0.0;
  lastResult = null;
  document.querySelector('.upload-btn').style.display = 'block';
  document.getElementById('loading-container').style.display = 'none';
  console.log('Reset to initial state.');
}
