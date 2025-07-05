import React, { useState, useEffect } from "react";
import "./App.css";
import { fetchMajorCities } from './utils/GeoService';

const API_KEY = "c243ac3c3d15f9e2e448a23933a051ae";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [history, setHistory] = useState([]);
  const [regionWeather, setRegionWeather] = useState([]);
  const [showAbout, setShowAbout] = useState(false);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  useEffect(() => {
    document.title = city ? `${city} | WeatherPeek` : "WeatherPeek 🌦️";
  }, [city]);

  const getWeather = async () => {
    if (!city) return;

    setLoading(true);
    setError("");
    setWeather(null);
    setRegionWeather([]);

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );
      const data = await response.json();

      if (data.cod !== 200) {
      // invalid city or response
      setError("Region not found");
      setCity("");
      return;
      }

      // If city exists but user input might be a region (e.g., country/state name)
      if (data.name?.toLowerCase() !== city.trim().toLowerCase()) {
      await getRegionWeather(city);
      setCity("");
      return;
}
      setWeather(data);

      setHistory((prev) => {
        const updated = prev.includes(city)
          ? prev
          : [city, ...prev.slice(0, 4)];
        return updated;
      });

      setCity(""); // Clear input after valid fetch

    } catch (error) {
      console.error(error);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getWeatherByLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);
    setRegionWeather([]);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
          );
          const data = await response.json();
          if (response.ok) {
            setWeather(data);
            setCity(""); // Clear input if GPS fetch works
          } else {
            setError(data.message || "Could not get weather from location");
          }
        } catch (err) {
          console.error(err);
          setError("Failed to fetch location-based weather.");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error(error);
        setError("Permission denied or location unavailable.");
        setLoading(false);
      }
    );
  };

  const getWeatherByCity = async (cityName) => {
    try {
      setError("");
      setWeather(null);
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      const data = await response.json();

      if (response.ok) {
        setWeather(data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const getRegionWeather = async (region) => {
    setLoading(true);
    setError("");
    setRegionWeather([]);

    try {
      const cities = await fetchMajorCities(region);
      if (!Array.isArray(cities) || cities.length === 0) {
        setError("No major cities found for this region.");
        return;
      }

      const weatherData = await Promise.all(
        cities.map(async (city) => {
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city.name}&appid=${API_KEY}&units=metric`
          );
          return await res.json();
        })
      );

      setRegionWeather(
        weatherData.filter(
          (item) => item && item.weather && item.weather[0] && item.main
        ).slice(0, 5)
      );

    } catch (err) {
      console.error("Region fetch error:", err);
      setError("Could not fetch region weather data");
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = async (cityName) => {
    setCity(cityName);
    await getWeatherByCity(cityName);
  };

  const removeCityFromHistory = (cityToRemove) => {
    setHistory((prev) => prev.filter((city) => city !== cityToRemove));
  };

  return (
    <div className={`App ${darkMode ? 'dark' : 'light'}`}>
      <button onClick={toggleDarkMode} className="toggle-btn">
        {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>
      <button onClick={() => setShowAbout(true)} className="about-btn">
      ℹ️ About
      </button>

      <h1>Weather Peek 🌦️</h1>
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search by city, state, or country"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") getWeather();
          }}
        />
        <div className="button-group">
          <button onClick={getWeather}>Get Weather</button>
          <button onClick={getWeatherByLocation} className="geo-btn">📍 Use My Location</button>
        </div>
      </div>

      <div className="content-wrapper">
        {history.length > 0 && (
          <div className="history">
            <p style={{ marginBottom: "1rem", marginRight: "1rem", fontWeight: "bold" }}>Recent Searches:</p>
            {history.map((city, index) => (
              <div key={index} className="history-btn">
                <span onClick={() => handleHistoryClick(city)}>{city}</span>
                <button className="remove-btn" onClick={() => removeCityFromHistory(city)}>✖</button>
              </div>
            ))}
          </div>
        )}

        {loading && <div className="spinner"></div>}
        {error && <p className="error-text">{error}</p>}

        {weather && (
          <div className="weather-card">
            <h2>{weather.name}, {weather.sys.country}</h2>
            <img
              src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
              alt="icon"
            />
            <p>{weather.weather[0].description}</p>
            <h3>{Math.round(weather.main.temp)}°C</h3>
            <p>Humidity: {weather.main.humidity}%</p>
            <p>Wind: {weather.wind.speed} m/s</p>
          </div>
        )}

        {regionWeather.length > 0 && (
          <div className="region-grid">
            {regionWeather.map((item, index) =>
              item?.weather && item.weather[0] && item.main ? (
                <div key={index} className="weather-card">
                  <h2>{item.name}, {item.sys?.country}</h2>
                  <img
                    src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                    alt="icon"
                  />
                  <p>{item.weather[0].description}</p>
                  <h3>{Math.round(item.main.temp)}°C</h3>
                  <p>Humidity: {item.main.humidity}%</p>
                  <p>Wind: {item.wind.speed} m/s</p>
                </div>
              ) : null
            )}
          </div>
        )}
      {showAbout && (
  <div className="modal-overlay" onClick={() => setShowAbout(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <button className="modal-close" onClick={() => setShowAbout(false)}>✖</button>
      <h2>About WeatherPeek</h2>
      <p>
        WeatherPeek is a modern weather app built with React that lets you search weather by city, state, or country.
        It uses the OpenWeatherMap API to fetch current data, and intelligently handles both city-level and region-wide queries.
      </p>
      <p>
        <strong>Features:</strong> Light/Dark mode toggle, location-based search, weather cards, and recent search history.
      </p>
      {/* <p>
        <strong>Tech Stack:</strong> React, OpenWeatherMap API, GeoDB Cities, HTML5, CSS3.
      </p> */}
      <p>
        <em>Note: This app is for informational purposes and may not reflect real-time changes perfectly.</em>
      </p>
    </div>
  </div>
)}
      </div>
      <div className="signature-box">Made by Vishal Kumar Dubey</div>
    </div>
  );
}

export default App;
