import React, { useEffect, useRef, useState } from "react";

export default function MeetingChecker() {
  const networkUpdateTime = 10; // in seconds
  const videoRef = useRef(null);
  const [battery, setBattery] = useState(null);
  const [networkSpeed, setNetworkSpeed] = useState(null);
  const [networkUpdateTimeLeft, setNetworkUpdateTimeLeft] =
    useState(networkUpdateTime);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const handleSpeakerTestButtonClick = () => {
    if (!audioRef.current) {
      console.error("Audio object not initialized.");
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    let networkIntervalId;
    let countdownId;

    // Speaker
    audioRef.current = new Audio(process.env.PUBLIC_URL + "/test_sound.wav");
    const currentAudio = audioRef.current;
    currentAudio.onended = () => {
      setIsPlaying(false);
    };

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

    // Network Speed
    const measureNetworkSpeed = async () => {
      try {
        const url =
          "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/%22Psst._don%27t_look_now%2C_but_you%27re_a_Supreme_Court_Justice.%22_Washington%2C_D.C.%2C_March_24._Awaiting_the_speedy_decision_of_the_Judiciary_Sub-committee_of_the_Senate_in_the_Appropriations_LCCN2016875318.tif/lossy-page1-1920px-thumbnail.tif.jpg";
        const measurements = [];

        for (let i = 0; i < 10; i++) {
          const start = performance.now();
          const response = await fetch(url);
          const blob = await response.blob();
          const end = performance.now();
          const sizeInBits = blob.size * 8;
          const durationInSeconds = (end - start) / 1000;
          const bitsPerSecond = sizeInBits / durationInSeconds;

          measurements.push(bitsPerSecond);
        }

        const avgBitsPerSecond =
          measurements.reduce((sum, val) => sum + val, 0) / measurements.length;

        let value, color;
        // Kbps
        if (avgBitsPerSecond < 1e6) {
          value = (avgBitsPerSecond / 1e3).toFixed(2) + " Kbps";
          color = "red";
        } else if (avgBitsPerSecond < 1e9) {
          value = (avgBitsPerSecond / 1e6).toFixed(2) + " Mbps";
          color = "orange";
        } else {
          value = (avgBitsPerSecond / 1e9).toFixed(2) + " Gbps";
          color = "green";
        }

        setNetworkSpeed({ value, color });
        setNetworkUpdateTimeLeft(networkUpdateTime);
      } catch (e) {
        console.error("Network speed check failed:", e);
        setNetworkSpeed({ value: "Error", color: "red" });
        setNetworkUpdateTimeLeft(networkUpdateTime);
      }
    };

    measureNetworkSpeed();
    networkIntervalId = setInterval(
      measureNetworkSpeed,
      networkUpdateTime * 1000
    );

    countdownId = setInterval(() => {
      setNetworkUpdateTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
      }
      audioRef.current = null;

      clearInterval(networkIntervalId);
      clearInterval(countdownId);
    };
  }, []);

  return (
    <div className="p-6 space-y-6 text-center">
      <h1 className="text-5xl">Ready to Meet?</h1>

      <div>
        <h2 className="text-3xl font-semibold mb-2">Webcam</h2>
        <video ref={videoRef} autoPlay className="w-64 h-48 border mx-auto" />
      </div>

      <div>
        <h2 className="text-3xl font-semibold mb-3">Battery Level</h2>
        <p>{battery !== null ? `${battery}%` : "Battery info not available"}</p>
      </div>

      <div>
        <h2 className="text-3xl font-semibold mb-3">Speaker</h2>
        <button
          onClick={handleSpeakerTestButtonClick}
          className={`rounded-lg  py-2 px-5 border border-transparent text-center text-xl text-white transition-all shadow hover:shadow-lg disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none ${
            isPlaying
              ? `bg-red-700 hover:bg-red-500`
              : `bg-blue-700 hover:bg-blue-500`
          } `}
        >
          {isPlaying ? "Stop" : "Start"}
        </button>
        {isPlaying && <p className="text-xl">Playing...</p>}
      </div>

      <div>
        <h2 className="text-3xl font-semibold mb-3">Network Speed</h2>
        <p
          className={
            networkSpeed?.color === "green"
              ? "text-green-600"
              : networkSpeed?.color === "orange"
              ? "text-orange-500"
              : networkSpeed?.color === "red"
              ? "text-read-600"
              : ""
          }
        >
          {networkSpeed?.value || `Measuring...`}
          {networkUpdateTimeLeft !== null && (
            <span className="text-gray-600 text-sm ml-2">
              (updated in {networkUpdateTimeLeft}s)
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
