import React, { useEffect, useRef, useState } from "react";

export default function MeetingChecker() {
  const videoRef = useRef(null);

  const [battery, setBattery] = useState(null);

  useEffect(() => {
    // Webcam
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("Webcam error: ", err));

    // Battery
    if (navigator.getBattery) {
      navigator.getBattery().then((batt) => {
        setBattery(Math.round(batt.level * 100));
        batt.addEventListener("levelchange", () =>
          setBattery(Math.round(batt.level * 100))
        );
      });
    }
  });

  return (
    <div className="p-6 space-y-6 text-center">
      <h1>Ready to Meet?</h1>

      <div>
        <h2 className="text-xl font-semibold">Webcam</h2>
        <video ref={videoRef} autoPlay className="w-64 h-48 border mx-auto" />
      </div>

      <div>
        <h2 className="text-xl font-semibold">Battery Level</h2>
        <p>{battery !== null ? `${battery}%` : "Battery info not available"}</p>
      </div>
    </div>
  );
}
