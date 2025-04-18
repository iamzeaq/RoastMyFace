import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import axiosInstance from "../../axios";
import roaster from "../assets/roaster.png";

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

const MemeMyFace = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [images, setImages] = useState([]);
  const [isFaceDetectionLoading, setIsFaceDetectionLoading] = useState(false);
  const [imageRoasts, setImageRoasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [selectedPackItem, setSelectedPackItem] = useState(null);
  const [packs, setPacks] = useState([]);
  const [loadingPacks, setLoadingPacks] = useState(true);
  const roastRef = useRef(null);

  useEffect(() => {
    const initializeModels = async () => {
      const success = await loadModels();
      setModelsLoaded(success);
    };
    initializeModels();

    // Load packs from JSON file
    const fetchPacks = async () => {
      try {
        const response = await fetch("/roastmyface_game_pack.json");
        if (!response.ok) {
          throw new Error("Failed to load packs");
        }
        const data = await response.json();
        setPacks(data.packs);
      } catch (error) {
        console.error("Error loading packs:", error);
        // Fallback to default packs if JSON loading fails
        setPacks(defaultPacks);
      } finally {
        setLoadingPacks(false);
      }
    };

    fetchPacks();
  }, []);

  // Default packs as fallback if JSON loading fails
  const defaultPacks = [
    {
      id: 1,
      title: "Politician Pack",
      items: [
        {
          type: "statement",
          text: "Who among these would make the worst president?",
        },
        {
          type: "question",
          text: "Rank these like Nigerian politicians.",
          required_pictures: 4,
        },
      ],
    },
    {
      id: 2,
      title: "Celebrity Pack",
      items: [
        {
          type: "statement",
          text: "If these people were celebrities, who's the cancelled one?",
        },
        {
          type: "question",
          text: "Rank these like problematic celebrities.",
          required_pictures: 3,
        },
      ],
    },
    {
      id: 3,
      title: "Meme Pack",
      items: [
        {
          type: "statement",
          text: "Pick who belongs in a meme the most.",
        },
        {
          type: "question",
          text: "Who's giving 'meme of the year' energy?",
          required_pictures: 2,
        },
      ],
    },
    {
      id: 4,
      title: "Create Your Own",
      items: [
        {
          type: "statement",
          text: "Write your own roast challenge.",
        },
        {
          type: "question",
          text: "Custom roast prompt.",
          required_pictures: 3,
        },
      ],
    },
  ];

  const handlePackSelect = (pack) => {
    setSelectedPack(pack);
    // Select a random question item from the pack
    const questionItems = pack.items.filter((item) => item.type === "question");
    if (questionItems.length > 0) {
      const randomItem =
        questionItems[Math.floor(Math.random() * questionItems.length)];
      setSelectedPackItem(randomItem);
    } else {
      setSelectedPackItem(null);
    }
    setImages([]);
    setImageRoasts([]);
  };

  const generateRoasts = async () => {
    if (
      !selectedPack ||
      !selectedPackItem ||
      images.length < selectedPackItem.required_pictures
    ) {
      alert(
        `Please upload at least ${selectedPackItem.required_pictures} valid image(s).`
      );
      return;
    }
    setLoading(true);

    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append("images", image);
    });
    formData.append("prompt", selectedPackItem.text); // Pass the prompt to the backend
    formData.append("packTitle", selectedPack.title); // Pass the pack title
    formData.append("style", "default"); // Keep compatibility with existing code

    try {
      const response = await axiosInstance.post("/api/mememyface", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Validate response
      if (!response.data.roasts || response.data.roasts.length === 0) {
        throw new Error("No roasts returned from the server.");
      }

      // Set the image roasts array
      setImageRoasts(response.data.roasts);

      // Scroll to results if available
      if (roastRef.current) {
        roastRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error fetching roasts:", error);
      alert(
        "Failed to generate roasts. Please try again or select another prompt."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (!modelsLoaded) {
      alert(
        "Model loading failed or is still in progress. Please try again later."
      );
      return;
    }

    setIsFaceDetectionLoading(true);
    const validImages = [];
    for (const file of files) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);

      try {
        await new Promise((resolve, reject) => {
          img.onload = async () => {
            try {
              const detections = await faceapi.detectAllFaces(
                img,
                new faceapi.TinyFaceDetectorOptions()
              );
              if (detections.length > 0) {
                validImages.push(file);
              } else {
                alert(
                  `No faces detected in one of the images. Skipping: ${file.name}`
                );
              }
              resolve();
            } catch (error) {
              console.error("Face detection error:", error);
              reject(error);
            } finally {
              URL.revokeObjectURL(img.src);
            }
          };
          img.onerror = () => {
            alert(`Invalid image file: ${file.name}`);
            URL.revokeObjectURL(img.src);
            reject(new Error("Invalid image"));
          };
        });
      } catch (err) {
        console.error("Error with face detection:", err);
      }
    }

    setIsFaceDetectionLoading(false);
    if (validImages.length > 0) {
      setImages(validImages);
      // Clear previous roasts when new images are uploaded
      setImageRoasts([]);
    }
  };

  return (
    <div className="min-h-screen bg-blue-700 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-4 FontdinerSwanky">MemeMyFace 🔥</h1>
      <p className="mb-6 text-center max-w-md text-gray-300 font-medium">
        Upload multiple pictures, pick a savage roast pack, and get AI roasts to
        cry-laugh about 😭
      </p>

      <Link
        to="/"
        className="mb-4 inline-block bg-white text-black font-semibold py-2 px-4 rounded shadow"
      >
        Back to Home
      </Link>

      {loadingPacks ? (
        <div className="mb-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          <p className="mt-2 text-lg font-medium">Loading packs...</p>
        </div>
      ) : (
        <div>
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-4xl">
            {packs.map((pack, index) => (
              <button
                key={index}
                onClick={() => handlePackSelect(pack)}
                className={`px-4 py-2 rounded text-sm FontdinerSwanky font-bold whitespace-nowrap shadow transition-all duration-200 ${
                  selectedPack?.title === pack.title
                    ? "bg-yellow-400 text-black"
                    : "bg-white text-blue-900 hover:bg-yellow-300"
                }`}
              >
                {pack.title}
              </button>
            ))}
          </div>

          {selectedPack && selectedPackItem && (
            <div className="flex items-center mb-4">
              <button
                onClick={() => {
                  const questionItems = selectedPack.items.filter(
                    (item) => item.type === "question"
                  );
                  if (questionItems.length > 1) {
                    let newItem;
                    do {
                      newItem =
                        questionItems[
                          Math.floor(Math.random() * questionItems.length)
                        ];
                    } while (newItem.text === selectedPackItem.text);

                    setSelectedPackItem(newItem);
                    setImageRoasts([]);
                  }
                }}
                className="bg-white w-65 m-auto text-black py-2 rounded font-semibold FontdinerSwanky"
              >
                Try Another Prompt
              </button>
            </div>
          )}
        </div>
      )}

      {selectedPack && selectedPackItem && (
        <>
          <p className="mb-2 text-lg text-center italic font-bold max-w-xl">
            {selectedPackItem.text}
          </p>

          <p className="mb-4 text-sm text-center text-yellow-200">
            Required images: {selectedPackItem.required_pictures}
          </p>

          <label className="ui-btn mb-4 cursor-pointer inline-block bg-white text-black font-semibold py-2 px-4 rounded shadow">
            <span>
              Upload Image 📸
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </span>
          </label>

          {isFaceDetectionLoading && (
            <div className="mb-4 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
              <p className="mt-2 text-lg font-medium">Detecting faces...</p>
            </div>
          )}

          {images.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4 w-full max-w-4xl bg-white p-2 rounded-lg">
                <div>
                  <p className="mb-2 text-center text-black italic font-semibold max-w-xl">
                    {selectedPackItem.text}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center"
                      style={{
                        width: `calc(${90 / images.length}vw - ${
                          images.length * 8
                        }px)`,
                      }}
                    >
                      <div className="overflow-hidden">
                        <img
                          src={URL.createObjectURL(img)}
                          alt={`Uploaded image ${i + 1} for roast`}
                          className="w-full h-24 sm:h-32 md:h-40 object-cover"
                        />

                        {imageRoasts.find(
                          (roast) => roast.imageIndex === i
                        ) && (
                          <>
                            <div className="flex items-center gap-1 pt-1">
                              <img
                                src={roaster}
                                alt="RoastMyFace logo"
                                className="rounded-full w-5 sm:w-6"
                              />
                              <div>
                                <h1 className="text-black text-[10px] sm:text-xs">
                                  RoastMyFace
                                </h1>
                                <p className="text-gray-600 text-[10px] sm:text-xs">
                                  @roastmyface
                                </p>
                              </div>
                            </div>

                            <div className="p-1 text-black">
                              <p className="font-medium text-xs sm:text-sm">
                                {
                                  imageRoasts.find(
                                    (roast) => roast.imageIndex === i
                                  ).roast
                                }
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Add "VS" between images, except after the last one */}
                      {i < images.length - 1 && (
                        <div className="flex items-center justify-center mx-1 sm:mx-2">
                          <span className="text-base sm:text-lg md:text-xl font-bold text-gray-700">
                            VS
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center mb-6">
                <p className="mb-2 text-sm">
                  {images.length}/{selectedPackItem.required_pictures} images
                  uploaded
                </p>
                <button
                  onClick={generateRoasts}
                  disabled={
                    loading ||
                    images.length < selectedPackItem.required_pictures
                  }
                  className={`px-6 py-2 rounded shadow font-bold ${
                    loading ||
                    images.length < selectedPackItem.required_pictures
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-yellow-400 text-black hover:bg-yellow-300"
                  }`}
                >
                  {loading ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black mr-2"></span>
                      Generating Roasts...
                    </>
                  ) : (
                    "Roast Me 🔥"
                  )}
                </button>
              </div>
            </>
          )}

          {/* {imageRoasts.length > 0 && (
                        <div ref={roastRef} className="mt-6 bg-white text-black p-4 rounded shadow max-w-xl w-full">
                            <h3 className="text-xl font-bold mb-2">AI Roast Results</h3>
                            <p className="text-sm text-gray-600 mb-4">Each image has been individually roasted above!</p>
                        </div>
                    )} */}
        </>
      )}
    </div>
  );
};

export default MemeMyFace;
