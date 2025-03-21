import * as posenet from "@tensorflow-models/posenet";

export function drawKeypoints(keypoints, minConfidence, ctx, videoWidth, videoHeight) {
  const scaleX = videoWidth / 250;
  const scaleY = videoHeight / 250;

  keypoints.forEach((keypoint) => {
    if (keypoint.score >= minConfidence) {
      const { y, x } = keypoint.position;
      ctx.beginPath();
      ctx.arc(x * scaleX, y * scaleY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "blue";
      ctx.fill();
    }
  });
}

export function drawSkeleton(keypoints, minConfidence, ctx, feedback) {
  console.log("Received keypoints:", keypoints);
  
  if (!keypoints || !Array.isArray(keypoints)) {
      console.error("Invalid keypoints received:", keypoints);
      return; // Stop execution if keypoints are missing
  }

  const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, minConfidence);
  
  // Debug adjacent keypoints
  console.log("Adjacent KeyPoints:", adjacentKeyPoints);

  // Determine color based on feedback
  const color = feedback?.includes("✅") ? "green" : "red";

  adjacentKeyPoints.forEach((keypoints) => {
      if (!keypoints[0]?.position || !keypoints[1]?.position) {
          console.error("Invalid keypoint structure:", keypoints);
          return;
      }

      ctx.beginPath();
      ctx.moveTo(keypoints[0].position.x, keypoints[0].position.y);
      ctx.lineTo(keypoints[1].position.x, keypoints[1].position.y);
      ctx.strokeStyle = color; // Use the determined color
      ctx.lineWidth = 2;
      ctx.stroke();
  });
}


