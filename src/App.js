import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SERVER_URL = "http://localhost:5001/api"

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [token, setToken] = useState('');

  const [text, setText] = useState('');
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
    }
  }, []);

  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await axios.post(`${SERVER_URL}/login`, {
        username,
        password
      });

      if (response.data.success) {
        const newToken = response.data.token;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setIsLoggedIn(true);
      }
    } catch (error) {
      setLoginError('Invalid username or password');
      console.error('Login failed:', error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setIsLoggedIn(false);
  };

  // Check grammar using API
  const checkGrammar = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setErrors([]);

    try {
      const response = await axios.post(
        `${SERVER_URL}/check-grammar`,
        { text },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setErrors(response.data.errors);
      }
    } catch (error) {
      console.error('Grammar check error:', error);

      if (error.response && error.response.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPreview = () => {
    if (!text) return 'Your corrected text will appear here';

    if (errors.length === 0 || loading) {
      return text;
    }

    let result = text;
    let offset = 0;

    const sortedErrors = [...errors].sort((a, b) => a.position - b.position);

    for (const error of sortedErrors) {
      const position = text.indexOf(error.word, error.position - 5 > 0 ? error.position - 5 : 0);
      if (position !== -1) {
        const before = result.slice(0, position + offset);
        const after = result.slice(position + offset + error.word.length);

        result = before + `<span class="bg-red-200 decoration-red-500">${error.word}</span>` + after;
        offset += (`<span class="bg-red-200 decoration-red-500">`.length + '</span>'.length);
      }
    }

    return <div dangerouslySetInnerHTML={{ __html: result }} />;
  };

  if (!isLoggedIn) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-2">Grammar Correction App</h1>
          <h2 className="text-xl text-center mb-6">Login</h2>

          {loginError && (
            <p className="text-red-500 text-center mb-4">{loginError}</p>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="text-gray-700 mb-2" htmlFor="username">
                Username:
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded"
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2" htmlFor="password">
                Password:
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded"
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              className="w-full bg-green-500 text-white font-semibold py-2 px-4 rounded"
              type="submit"
            >
              Login
            </button>
          </form>

          <p className="text-gray-600 text-sm text-center mt-6">
            Use "admin" for both username and password
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold">Grammar Correction App</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-2 px-4 rounded"
        >
          Logout
        </button>
      </header>

      <main>
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Preview:</h3>
          <div className="bg-gray-50 p-4 rounded min-h-[100px]">
            {renderPreview()}
          </div>
        </div>

        <div>
          <textarea
            className="w-full p-4 border border-gray-300 rounded-lg mb-4"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to check for grammar errors..."
            rows={8}
          />

          <button
            onClick={checkGrammar}
            className={"w-full py-3 px-4 rounded-lg font-semibold text-white bg-green-500"}
          >
            {loading ? 'Checking...' : 'Check Grammar'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;