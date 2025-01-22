import { useEffect, useState } from "react";
import axios from "axios";
import { FaUser, FaRobot } from "react-icons/fa";
import { MdOutlineScheduleSend } from "react-icons/md";
import { IoSendSharp } from "react-icons/io5";

const API_URL = "http://127.0.0.1:8000/get_suppliers";

const App = () => {
  const [userMessage, setUserMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  console.log(chat);

  useEffect(() => {
    setChat([
      {
        user: "",
        bot: (
          <div>
            <div className="bg-gray-200 p-2 rounded-lg mb-2">
              Hello! Please choose one of the following products:
            </div>
            <ul className="list-none pl-0 w-fit">
              <li className="bg-blue-200 p-2 rounded mb-1">Laptop</li>
              <li className="bg-blue-200 p-2 rounded mb-1">Tablet</li>
              <li className="bg-blue-200 p-2 rounded">Smartphone</li>
            </ul>
          </div>
        ),
      },
    ]);
  }, []);

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;

    setChat((prevChat) => [
      ...prevChat,
      { user: userMessage, bot: "Thinking..." },
    ]);
    setLoading(true);

    const message =
      userMessage.charAt(0).toUpperCase() + userMessage.slice(1).toLowerCase();

    if (
      message === "Laptop" ||
      message === "Tablet" ||
      message === "Smartphone"
    ) {
      try {
        const response = await axios.post(API_URL, {
          product_name: message,
        });

        setChat((prevChat) => [
          ...prevChat.slice(0, -1),
          { user: userMessage, bot: response.data || "No response" },
        ]);
      } catch (error) {
        setChat((prevChat) => [
          ...prevChat.slice(0, -1),
          { user: userMessage, bot: "Error processing request" },
        ]);
      }
    } else {
      setChat((prevChat) => [
        ...prevChat.slice(0, -1),
        { user: userMessage, bot: "You must select a product" },
      ]);
    }

    setLoading(false);
    setUserMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100 p-5">
      <h1 className="text-2xl font-bold mb-4">Product Agent Chatbot</h1>

      <div className="w-full max-w-lg bg-white p-4 rounded-lg shadow-md h-[700px] overflow-y-auto">
        {chat.map((message, index) => (
          <div key={index} className="mb-2">
            {message.user && (
              <div>
                <div className="flex items-center text-blue-600 font-semibold">
                  <FaUser className="mr-2" />
                  User:
                </div>
                <div className="bg-gray-200 p-2 rounded-lg mb-2">
                  {message.user}
                </div>
              </div>
            )}
            <div className="flex items-center text-green-600 font-semibold mb-1">
              <FaRobot className="mr-2" />
              Bot:
            </div>
            <div className="text-gray-800">
              {message.bot.store ? (
                <div className="grid bg-gray-200 p-2 rounded-lg mb-2">
                  <p>
                    Store Name: <span>{message.bot.store.name}</span>
                  </p>
                  <p>
                    Location:
                    <span>{message.bot.store.location}</span>
                  </p>{" "}
                  <p>
                    Details:
                    <span>{message.bot.store.summary}</span>
                  </p>
                </div>
              ) : (
                <div className="bg-gray-200 p-2 rounded-lg mb-2">
                  {message.bot}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full max-w-md flex mt-4">
        <input
          type="text"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-l-md"
        />
        <button
          onClick={handleSendMessage}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-r-md disabled:bg-gray-400"
        >
          {loading ? <MdOutlineScheduleSend /> : <IoSendSharp />}
        </button>
      </div>
    </div>
  );
};

export default App;
