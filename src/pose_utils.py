import numpy as np
import mediapipe as mp

mp_pose = mp.solutions.pose

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

def analyze_bicep_curl(landmarks):
    print("DEBUG: Landmarks received:", landmarks)
    if not landmarks:
        return "No landmarks detected!"
    return "Pose detected!"


    
