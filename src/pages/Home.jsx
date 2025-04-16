import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import axiosInstance from "../../axios";
import roaster from "../assets/roaster.png";
import html2canvas from "html2canvas";
import * as faceapi from "face-api.js";

const loadModels = async () => {
  try {
    console.log("Loading face-api.js models...");
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    console.log("Models loaded successfully");
    return true;
  } catch (error) {
    console.error("Error loading face-api.js models:", error);
    return false;
  }
};

const Home = () => {
  const roastRef = useRef(null);
  const [image, setImage] = useState(null);
  const [roastStyle, setRoastStyle] = useState("default");
  const [roasts, setRoasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFaceDetectionLoading, setIsFaceDetectionLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const initializeModels = async () => {
      const success = await loadModels();
      setModelsLoaded(success);
    };
    initializeModels();
  }, []);

  const generateRoasts = async () => {
    if (!image) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("image", image);
    formData.append("style", roastStyle);

    try {
      const response = await axiosInstance.post("/api/roast", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setRoasts(response.data.roasts);
    } catch (error) {
      console.error("Error fetching roast:", error);
      setRoasts(["Oops! Something went wrong. Try again later."]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!modelsLoaded) {
      alert("Model loading failed or is still in progress. Please try again later.");
      return;
    }

    setIsFaceDetectionLoading(true);

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        const detections = await faceapi.detectAllFaces(
          img,
          new faceapi.TinyFaceDetectorOptions()
        );

        setIsFaceDetectionLoading(false);

        if (detections.length === 0) {
          alert("No faces detected in the image! Please upload a photo with a person's face.");
          setImage(null);
          setRoasts([]);
        } else {
          setImage(file);
          setRoasts([]);
        }
      } catch (error) {
        console.error("Face detection error:", error);
        alert("Error processing the image. Please try again.");
        setIsFaceDetectionLoading(false);
      } finally {
        URL.revokeObjectURL(img.src);
      }
    };
    img.onerror = () => {
      alert("Invalid image file. Please upload a valid image.");
      URL.revokeObjectURL(img.src);
      setIsFaceDetectionLoading(false);
    };
  };

  const replaceUnsupportedColors = (element) => {
    const elements = element.querySelectorAll("*");
    elements.forEach((el) => {
      const style = window.getComputedStyle(el);
      if (style.backgroundColor.includes("oklch")) {
        el.style.backgroundColor = "#ffffff";
      }
      if (style.color.includes("oklch")) {
        el.style.color = "#000000";
      }
    });
  };

  const handleShare = async () => {
    if (!roastRef.current) return;

    replaceUnsupportedColors(roastRef.current);

    try {
      const canvas = await html2canvas(roastRef.current, {
        backgroundColor: "#fff",
        scale: 2,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], "roastmyface.png", { type: "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: "RoastMyFace 🔥",
              text: "Check out this roast I got! 😂",
            });
          } catch (err) {
            console.error("Sharing failed", err);
          }
        } else {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "roastmyface.png";
          link.click();
          URL.revokeObjectURL(url);
          alert("Sharing not supported on this device. Image downloaded instead.");
        }
      }, "image/png");
    } catch (error) {
      console.error("Error generating image for sharing:", error);
    }
  };

  const roastOptions = [
    { value: "default", label: "🔥 Default English" },
    { value: "pidgin", label: "🇳🇬 Nigerian Pidgin" },
    { value: "patois", label: "🇯🇲 Jamaican Patois" },
  ];

  const selectedOption = roastOptions.find((opt) => opt.value === roastStyle);

  return (
    <div className="Home">
      <div className="min-h-screen bg-orange-700 text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-bold mb-4 FontdinerSwanky">RoastMyFace 🔥</h1>
        <p className="mb-6 text-center max-w-md text-gray-400 font-medium FontdinerSwanky">
          Upload a picture and get savage roasts. Share with friends and laugh your stress away 😭
        </p>

        <div>
          <Link to="/mememyface" className="mb-4 inline-block bg-white text-black font-semibold py-2 px-4 rounded shadow">
            Visit MemeMyFace
          </Link>
        </div>

        <label className="ui-btn mb-4 cursor-pointer inline-block bg-white text-black font-semibold py-2 px-4 rounded shadow">
          <span>
            Upload Image 📸
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </span>
        </label>

        {isFaceDetectionLoading && (
          <div className="mb-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            <p className="mt-2 text-lg font-medium">Detecting face...</p>
          </div>
        )}

        <div className="mb-6 w-full max-w-[200px] text-left">
          <label className="block text-sm font-semibold text-gray-300 mb-2 FontdinerSwanky">
            🧠 Select Your Roast Style
          </label>
          <div
            className="relative max-w-xs"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button className="appearance-none w-full bg-gray-900 text-white border border-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500 px-4 py-3 shadow-sm transition-all duration-200 flex items-center justify-between">
              {selectedOption?.label || "Choose Style"}
              <span className="text-gray-400">▼</span>
            </button>
            {dropdownOpen && (
              <ul className="absolute left-0 top-full w-full bg-gray-900 border border-gray-700 shadow-lg z-50">
                {roastOptions.map((option) => (
                  <li
                    key={option.value}
                    onClick={() => {
                      setRoastStyle(option.value);
                      setDropdownOpen(false);
                    }}
                    className="px-4 py-2 text-white hover:bg-yellow-500 hover:text-black cursor-pointer transition-all"
                  >
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {image && (
          <div ref={roastRef} id="roast-card" className="p-6 max-w-xs rounded bg-white">
            <div className="mb-2">
              <img
                src={URL.createObjectURL(image)}
                alt="Uploaded preview"
                className="w-full h-full object-cover rounded-sm mx-auto"
              />
            </div>

            {roasts.length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-2">
                  <img src={roaster} alt="logo" className="rounded-full w-10" />
                  <div>
                    <h1 className="text-black text-xs">RoastMyFace</h1>
                    <p className="text-gray-600 text-xs">@roastmyface</p>
                  </div>
                </div>

                <div className="w-full max-w-md space-y-4 mb-4">
                  {roasts.map((roast, i) => (
                    <div key={i} className="pt-4 text-sm text-black">
                      {roast}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {image && (
          <button
            onClick={generateRoasts}
            disabled={loading}
            className={`bg-red-600 w-xs ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-700'} text-white rounded font-bold py-2 px-6 shadow-md mt-4`}
          >
            {loading ? "Roasting..." : "Roast My Face"}
          </button>
        )}

        {roasts.length > 0 && (
          <button
            onClick={handleShare}
            className="mt-4 w-xs bg-green-600 hover:bg-green-700 py-2 rounded font-bold cursor-pointer"
          >
            Share Roast <i className="fa-solid fa-paper-plane"></i>
          </button>
        )}

        <footer className="mt-10 text-sm text-gray-900 font-medium FontdinerSwanky">
          © 2025 RoastMyFace. Built for vibes only. 😎
        </footer>
      </div>
    </div>
  );
};

export default Home;