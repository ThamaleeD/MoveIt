from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import mediapipe as mp
import os  # Add at the top of your server.py

app = Flask(__name__)
CORS(app)

mp_pose = mp.solutions.pose

@app.route("/", methods=["GET"])
def home():
    return "Flask is running!"

@app.route("/detect_pose", methods=["POST"])
def detect_pose():
    data = request.get_json()
    if not data:
        return jsonify({"feedback": "❌ No pose data received!"})

    landmarks = data.get("keypoints")
    if not landmarks:
        return jsonify({"feedback": "❌ No landmarks detected!"})

    feedback = analyze_bicep_curl(landmarks)
    return jsonify({"feedback": feedback})

def analyze_bicep_curl(landmarks):
    # Implement the logic to analyze bicep curl based on landmarks
    try:
        shoulder = np.array([landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]['x'],
                             landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]['y']])
        elbow = np.array([landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value]['x'],
                          landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value]['y']])
        wrist = np.array([landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]['x'],
                          landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]['y']])

        elbow_angle = calculate_angle(shoulder, elbow, wrist)

        if elbow_angle > 160:
            return "⬆️ Extend arm fully for a proper rep"
        elif elbow_angle < 50:
            return "⬇️ Curl too high, keep control"
        else:
            return "✅ Good curl!"
    except Exception as e:
        return f"⚠️ Error in bicep curl analysis: {str(e)}"

def calculate_angle(a, b, c):
    """Calculate the angle between three points (in degrees)."""
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    ba = a - b  # Vector from B to A
    bc = c - b  # Vector from B to C

    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    angle = np.degrees(np.arccos(np.clip(cosine_angle, -1.0, 1.0)))  # Ensure valid range
    return angle

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
    app.run(host="0.0.0.0", port=port)