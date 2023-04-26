import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function NewPost() {
  const [file, setFile] = useState();
  const [caption, setCaption] = useState("");

  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("image", file);
    formData.append("caption", caption);
    await axios.post("/api/posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    navigate("/");
  };

  const fileSelected = (event) => {
    const file = event.target.files[0];
    setFile(file);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <form
        onSubmit={submit}
        className="flex flex-col space-y-5 px-5 py-14 w-5/6 sm:w-4/6 lg:w-1/2"
      >
        <input onChange={fileSelected} type="file" accept="image/*"></input>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          type="text"
          placeholder="標題"
          className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-500"
        ></input>
        <button
          type="submit"
          class="self-center w-40 py-2 px-4 bg-blue-500 hover:bg-blue-600 focus:ring-blue-700 focus:ring-offset-blue-200 text-white rounded-md shadow-sm"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
