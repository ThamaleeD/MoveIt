import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as poseDetection from "@tensorflow-models/pose-detection";
import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

// ✅ Initialize TensorFlow backend
async function initializeTF() {
  await tf.ready();
  try {
    await tf.setBackend("webgl");
    console.log("✅ TensorFlow.js Backend Initialized:", tf.getBackend());
  } catch (error) {
    console.error("⚠️ WebGL not available. Falling back to CPU.");
    await tf.setBackend("cpu");
  }
}
initializeTF();

const PoseEstimation = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // --- State ---
  const [feedback, setFeedback] = useState("No feedback yet");
  const [repCount, setRepCount] = useState(0);
  const [detector, setDetector] = useState(null);
  // Track the current elbow angle for display
  const [currentElbowAngle, setCurrentElbowAngle] = useState(0);

  // Instead of repPhase state, we use a ref for immediate toggling:
  const readyToCountRef = useRef(true); // true when ready to count a new rep

  // ✅ Load Pose Detection Model
  useEffect(() => {
    const loadModel = async () => {
      console.log("⏳ Loading MoveNet Model...");
      try {
        const poseDetector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
          }
        );
        setDetector(poseDetector);
        console.log("✅ MoveNet Model Loaded!");
      } catch (error) {
        console.error("❌ Error loading MoveNet Model:", error);
      }
    };
    loadModel();
  }, []);

  // ✅ Send pose data to backend (if needed)
  async function sendPoseImage(imageData) {
    try {
      const response = await fetch("http://127.0.0.1:5000/detect_pose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        throw new Error("❌ Failed to process pose");
      }

      const result = await response.json();
      return result.feedback || "No feedback received";
    } catch (error) {
      console.error("❌ Error sending pose image:", error);
      return "Error processing feedback";
    }
  }

  // ✅ Run Pose Detection
  useEffect(() => {
    if (!detector) return;
    console.log("🚀 Running Pose Detection...");

    const processFrame = async () => {
      const video = webcamRef.current?.video;
      if (video && video.readyState === 4) {
        // Ensure canvas matches actual video size
        if (canvasRef.current) {
          canvasRef.current.width = video.videoWidth;
          canvasRef.current.height = video.videoHeight;
        }

        // Flip horizontally for a front-facing (selfie) camera
        const poses = await detector.estimatePoses(video, {
          flipHorizontal: true,
        });

        if (poses.length > 0) {
          const angle = calculateElbowAngle(poses[0].keypoints); // compute new angle
          setCurrentElbowAngle(angle); // update state for UI display (optional)
          drawSkeleton(poses[0], angle); // pass the current angle to drawing function
          handleRepCount(angle);
        }
      } else {
        console.warn("⚠️ Video not ready yet. Skipping frame...");
      }
      requestAnimationFrame(processFrame);
    };
    requestAnimationFrame(processFrame);
  }, [detector]);

  // ✅ Keypoint pairs for drawing skeleton
  const keypointPairs = [
    [5, 7],
    [7, 9],
    [6, 8],
    [8, 10],
    [5, 6],
    [5, 11],
    [6, 12],
    [11, 13],
    [13, 15],
    [12, 14],
    [14, 16],
  ];

  // ✅ Draw keypoints & skeleton
  const drawSkeleton = (pose, currentAngle) => {
  const ctx = canvasRef.current?.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 3;

  if (!pose || !pose.keypoints) {
    console.warn("⚠️ No keypoints detected.");
    return;
  }

 // Draw keypoints
 pose.keypoints.forEach((keypoint, index) => {
  if (keypoint.score > 0.5) {
    ctx.beginPath();
    ctx.arc(keypoint.x, keypoint.y, 8, 0, 2 * Math.PI);
    // For the left elbow (index 7), turn green if the currentAngle is between 60 and 90; otherwise red.
    if (index === 7) {
      console.log("Left elbow angle passed to drawSkeleton:", currentAngle);
      if (currentAngle >= 60 && currentAngle <= 90) {
        console.log("Left elbow is within [60,90] -> green");
        ctx.fillStyle = "green";
      } else {
        console.log("Left elbow not in [60,90] -> red");
        ctx.fillStyle = "red";
      }
    } else {
      ctx.fillStyle = "red";
    }
    ctx.fill();
  }
});

// Draw skeleton lines
keypointPairs.forEach(([i, j]) => {
  const kp1 = pose.keypoints[i];
  const kp2 = pose.keypoints[j];

  if (kp1 && kp2 && kp1.score > 0.5 && kp2.score > 0.5) {
    ctx.beginPath();
    ctx.moveTo(kp1.x, kp1.y);
    ctx.lineTo(kp2.x, kp2.y);
    ctx.stroke();
  }
});
};

  // ✅ Rep Counting Logic using range [65,75] for flexed rep count
  // The function now receives the computed elbowAngle.
  const handleRepCount = (elbowAngle) => {
    // Define thresholds – adjust these if your real angles differ
    const minElbowAngleLow = 65;  // lower bound for flexed range
    const minElbowAngleHigh = 75; // upper bound for flexed range
    const maxElbowAngle = 140;    // Arm fully extended threshold

    console.log(`Ready to count: ${readyToCountRef.current}, angle: ${elbowAngle}`);

    // Count rep if angle is between 65 and 75 and we're ready
    if (
      elbowAngle >= minElbowAngleLow &&
      elbowAngle <= minElbowAngleHigh &&
      readyToCountRef.current
    ) {
      console.log(`Arm flexed in [65-75] -> Count 1 rep (angle: ${elbowAngle})`);
      setRepCount((prevCount) => prevCount + 1);
      readyToCountRef.current = false;
    }
    // Reset readyToCount if arm is extended above 140
    else if (elbowAngle > maxElbowAngle && !readyToCountRef.current) {
      console.log(`Arm extended above 140 -> Ready for next rep (angle: ${elbowAngle})`);
      readyToCountRef.current = true;
    }
  };

  // ✅ Calculate angle between three points
  function calculate_angle(a, b, c) {
    if (!a || !b || !c) return 0;
    const radians =
      Math.atan2(c.y - b.y, c.x - b.x) -
      Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * (180.0 / Math.PI));
    if (angle > 180.0) {
      angle = 360.0 - angle;
    }
    return angle;
  }

  // ✅ Extract elbow angle (Left Arm)
  function calculateElbowAngle(keypoints) {
    // Left Arm Indices:
    // 5 = left shoulder, 7 = left elbow, 9 = left wrist
    // If you are actually curling with your RIGHT arm, switch to [6, 8, 10].
    const shoulder = keypoints[5];
    const elbow = keypoints[7];
    const wrist = keypoints[9];

    if (!shoulder || !elbow || !wrist) return 0;
    return calculate_angle(shoulder, elbow, wrist);
  }

  // ✅ (Optional) Extract elbow angle (Right Arm)
  // If you want to track the right arm, you can call this function instead.
  // For example, to see the right elbow angle in your code, you'd do:
  //   const angle = calculateRightElbowAngle(poses[0].keypoints);
  //   setCurrentElbowAngle(angle);
  //   handleRepCount(angle);
  function calculateRightElbowAngle(keypoints) {
    // Right Arm Indices:
    // 6 = right shoulder, 8 = right elbow, 10 = right wrist
    const shoulder = keypoints[6];
    const elbow = keypoints[8];
    const wrist = keypoints[10];

    if (!shoulder || !elbow || !wrist) return 0;
    return calculate_angle(shoulder, elbow, wrist);
  }

  return (
    <div className="App">
      <h1>Pose Estimation</h1>

      <div className="video-container" style={{ position: "relative" }}>
        <Webcam
          ref={webcamRef}
          style={{ width: 640, height: 480 }}
          videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 10,
            pointerEvents: "none",
          }}
        />
      </div>

      <p>{feedback}</p>
      <p>Reps: {repCount}</p>
      <p>Current Elbow Angle: {currentElbowAngle.toFixed(2)}</p>
    </div>
  );
};

export default PoseEstimation;
