import { useState } from "react";
import axiosInstance from "../../axios";
import roaster from "../assets/roaster.png";

const Home = () => {
  const [image, setImage] = useState(null);
  const [roastStyle, setRoastStyle] = useState("default");
  const [roasts, setRoasts] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateRoasts = async () => {
    if (!image) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("image", image);
    formData.append("style", roastStyle);

    try {
      const response = await axiosInstance.post(
        "/api/roast",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setRoasts(response.data.roasts);
    } catch (error) {
      console.error("Error fetching roast:", error);
      setRoasts(["Oops! Something went wrong. Try again later."]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setRoasts([]);
  };

  return (
    <div className="Home">
      <div className="min-h-screen bg-orange-700 text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-bold mb-4">RoastMyFace 🔥</h1>
        <p className="mb-6 text-center max-w-md text-gray-400">
          Upload a picture and get 3 savage roasts. Share with friends and laugh
          your stress away 😭
        </p>

        <label className="mb-4 cursor-pointer inline-block bg-white text-black font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-100 transition duration-200">
          Upload Image 📸
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            🧠 Select Your Roast Style
          </label>
          <div className="relative">
            <select
              value={roastStyle}
              onChange={(e) => setRoastStyle(e.target.value)}
              className="w-xs appearance-none bg-gray-900 text-white border border-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500 px-4 py-3 rounded-xl shadow-sm transition-all duration-200"
            >
              <option value="default">🔥 Default English</option>
              <option value="pidgin">🇳🇬 Nigerian Pidgin</option>
              <option value="patois">🇯🇲 Jamaican Patois</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
              ▼
            </div>
          </div>
        </div>

        {image && (
          <div className="p-6 max-w-xs rounded bg-white">
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
            className="bg-red-600 w-xs hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-md mt-4"
          >
            {loading ? "Roasting..." : "Roast My Face"}
          </button>
        )}

        {roasts.length > 0 && (
          <>
            <button className="mt-4 w-xs bg-green-600 hover:bg-green-700 py-2 rounded-xl font-bold">
              Share Roast 🔗
            </button>
          </>
        )}

        <footer className="mt-10 text-sm text-gray-600">
          &copy; 2025 RoastMyFace. Built for vibes only. 😎
        </footer>
      </div>
    </div>
  );
};

export default Home;
