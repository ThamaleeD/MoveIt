export const sendPoseImage = async (pose) => {
  if (!pose) return;

  try {
      const response = await fetch("http://127.0.0.1:5000/detect_pose", {
          method: "POST",
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(pose),
        });

        if (!response.ok) throw new Error("Failed to send pose data");

        const data = await response.json();
        console.log("Pose Feedback:", data.feedback);
        return data.feedback;  // Return feedback to be displayed
    } catch (error) {
        console.error("Error sending pose data:", error);
        return "⚠️ Error processing pose!";
    }
};
     