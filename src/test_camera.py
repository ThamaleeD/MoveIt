import cv2

cap = cv2.VideoCapture(0)  # Try changing 0 to 1 or 2 if this doesn't work


while True:
    ret, frame = cap.read()
    if not ret:
        print("⚠️ Camera not detected. Try changing the index (0,1,2).")
        break

    cv2.imshow("Webcam Test", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
