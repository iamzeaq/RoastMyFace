import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
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

const MemeMyFace = () => {
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [images, setImages] = useState([]);
    const [isFaceDetectionLoading, setIsFaceDetectionLoading] = useState(false);
    const roastRef = useRef(null);
    const [roasts, setRoasts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const initializeModels = async () => {
            const success = await loadModels();
            setModelsLoaded(success);
        };
        initializeModels();
    }, []);

    const generateRoasts = async () => {
        if (images.length === 0) return;
        setLoading(true);

        const formData = new FormData();
        images.forEach((image, index) => {
            formData.append(`image${index}`, image);
        });
        formData.append("style", "default");

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
        const files = Array.from(e.target.files);
        if (!files.length) return;

        if (!modelsLoaded) {
            alert("Model loading failed or is still in progress. Please try again later.");
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

                            if (detections.length === 0) {
                                alert(`No faces detected in one of the images! Skipping: ${file.name}`);
                            } else {
                                validImages.push(file);
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
                        alert(`Invalid image file: ${file.name}. Please upload a valid image.`);
                        URL.revokeObjectURL(img.src);
                        reject(new Error("Invalid image"));
                    };
                });
            } catch (error) {
                console.error("Error processing image:", error);
            }
        }

        setIsFaceDetectionLoading(false);

        if (validImages.length === 1) {
            alert("Please upload more than one image.");
            return;
        }

        if (validImages.length > 0) {
            setImages((prevImages) => [...prevImages, ...validImages]);
            setRoasts([]);
        }
    };

    return (
        <div className="MemeMyFace">
            <div className="min-h-screen bg-blue-700 text-white flex flex-col items-center justify-center p-6">
                <h1 className="text-4xl font-bold mb-4 FontdinerSwanky">MemeMyFace 🔥</h1>
                <p className="mb-6 text-center max-w-md text-gray-400 font-medium FontdinerSwanky">
                    Upload multiple pictures, ask a question, and get savage roasts. Share with friends and laugh your stress away 😭
                </p>
                <div>
                    <Link to="/" className="mb-4 inline-block bg-white text-black font-semibold py-2 px-4 rounded shadow">
                        Back to Home
                    </Link>
                </div>

                <label className="ui-btn mb-6 cursor-pointer inline-block bg-white text-black font-semibold py-2 px-4 rounded shadow">
                    <span>
                        Upload Images 📸
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
                    <div className="mb-6 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                        <p className="mt-2 text-lg font-medium">Detecting faces...</p>
                    </div>
                )}

                {images.length > 0 && (
                    <div className="w-full max-w-3xl overflow-hidden mb-4">
                        <style>
                            {`
                                @keyframes scrollRightToLeft {
                                    0% { transform: translateX(0); }
                                    100% { transform: translateX(-50%); }
                                }
                                .scroll-container {
                                    display: flex;
                                    gap: 12px;
                                    width: 200%;
                                    animation: scrollRightToLeft 15s linear infinite;
                                }
                                .scroll-container:hover {
                                    animation-play-state: paused;
                                }
                                .scroll-content {
                                    display: flex;
                                    flex: 1 0 50%;
                                    gap: 12px;
                                }
                            `}
                        </style>
                        <div className="scroll-container">
                            <div className="scroll-content">
                                <button className="ui-btn cursor-pointer bg-white text-black font-semibold py-2 px-4 rounded shadow whitespace-nowrap">
                                    Politician Pack
                                </button>
                                <button className="ui-btn cursor-pointer bg-white text-black font-semibold py-2 px-4 rounded shadow whitespace-nowrap">
                                    Celebrity Pack
                                </button>
                                <button className="ui-btn cursor-pointer bg-white text-black font-semibold py-2 px-4 rounded shadow whitespace-nowrap">
                                    Meme Pack
                                </button>
                                <button className="bg-white text-black cursor-pointer font-semibold py-2 px-4 rounded shadow whitespace-nowrap">
                                    Ask your own Prompts
                                </button>
                                <button className="bg-white text-black cursor-pointer font-semibold py-2 px-4 rounded shadow whitespace-nowrap">
                                    Create your own pack
                                </button>
                            </div>
                            <div className="scroll-content">
                                <button className="ui-btn cursor-pointer bg-white text-black font-semibold py-2 px-4 rounded shadow whitespace-nowrap">
                                    Politician Pack
                                </button>
                                <button className="ui-btn cursor-pointer bg-white text-black font-semibold py-2 px-4 rounded shadow whitespace-nowrap">
                                    Celebrity Pack
                                </button>
                                <button className="ui-btn cursor-pointer bg-white text-black font-semibold py-2 px-4 rounded shadow whitespace-nowrap">
                                    Meme Pack
                                </button>
                                <button className="bg-white text-black cursor-pointer font-semibold py-2 px-4 rounded shadow whitespace-nowrap">
                                    Ask your own Prompts
                                </button>
                                <button className="bg-white text-black cursor-pointer font-semibold py-2 px-4 rounded shadow whitespace-nowrap">
                                    Create your own pack
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {images.length > 0 && (
                    <div ref={roastRef} id="roast-card" className="p-6 max-w-2xl w-full">
                        <div className={`flex flex-col items-center ${images.length === 2 ? 'flex-row justify-center gap-4' : images.length === 4 ? 'grid md:grid-cols-2 gap-4' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'}`}>
                            {images.map((image, index) => (
                                <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-[250px]">
                                    <img
                                        src={URL.createObjectURL(image)}
                                        alt={`Uploaded preview ${index + 1}`}
                                        className="w-full h-[280px] object-cover rounded-t-lg"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemeMyFace;