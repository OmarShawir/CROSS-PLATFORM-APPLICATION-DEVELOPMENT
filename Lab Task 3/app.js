// Wrap all code in a DOMContentLoaded event listener to prevent global variables
document.addEventListener("DOMContentLoaded", () => {
    // --- Application State ---
    const appState = {
        lastSearchedCity: "",
        lastResolvedTimezone: "",
        debounceTimer: null,
        recentSearches: [],
        unit: "C",
        lastWeatherData: null,
        lastResolvedName: ""
    };

    // --- Lookup Data ---
    // Maps WMO weather codes to human-readable descriptions and emojis
    const weatherCodeMap = {
        0: { text: "Clear sky", icon: "☀️" },
        1: { text: "Mainly clear", icon: "🌤️" },
        2: { text: "Partly cloudy", icon: "⛅" },
        3: { text: "Overcast", icon: "☁️" },
        45: { text: "Fog", icon: "🌫️" },
        48: { text: "Depositing rime fog", icon: "🌫️" },
        51: { text: "Light drizzle", icon: "🌦️" },
        53: { text: "Moderate drizzle", icon: "🌦️" },
        55: { text: "Dense drizzle", icon: "🌧️" },
        56: { text: "Light freezing drizzle", icon: "🌧️" },
        57: { text: "Dense freezing drizzle", icon: "🌧️" },
        61: { text: "Slight rain", icon: "🌦️" },
        63: { text: "Moderate rain", icon: "🌧️" },
        65: { text: "Heavy rain", icon: "🌧️" },
        66: { text: "Light freezing rain", icon: "🌧️" },
        67: { text: "Heavy freezing rain", icon: "🌧️" },
        71: { text: "Slight snow fall", icon: "🌨️" },
        73: { text: "Moderate snow fall", icon: "❄️" },
        75: { text: "Heavy snow fall", icon: "❄️" },
        77: { text: "Snow grains", icon: "❄️" },
        80: { text: "Slight rain showers", icon: "🌦️" },
        81: { text: "Moderate rain showers", icon: "🌧️" },
        82: { text: "Violent rain showers", icon: "⛈️" },
        85: { text: "Slight snow showers", icon: "🌨️" },
        86: { text: "Heavy snow showers", icon: "❄️" },
        95: { text: "Thunderstorm", icon: "⛈️" },
        96: { text: "Thunderstorm with slight hail", icon: "⛈️" },
        99: { text: "Thunderstorm with heavy hail", icon: "⛈️" }
    };

    // --- UI Helper Functions ---

    // Removes skeleton loading classes from all elements
    function removeAllSkeletons() {
        document.querySelectorAll(".skeleton").forEach((element) => {
            element.classList.remove("skeleton");
        });
    }

    // Adds skeleton loading classes to prepare UI for new data
    function addAllSkeletons() {
        const ids = [
            "cityName",
            "weatherDescription",
            "weatherIcon",
            "temperature",
            "humidity",
            "windSpeed",
            "localTime"
        ];

        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add("skeleton");
            }
        });

        document
            .querySelectorAll(".forecast-day, .forecast-icon, .forecast-temp")
            .forEach((el) => {
                el.classList.add("skeleton");
            });
    }

    // Displays the error banner with a specific message
    function showError(message) {
        const banner = document.getElementById("errorBanner");
        const text = document.getElementById("errorText");
        text.textContent = message;
        banner.classList.remove("hidden");
    }

    // Hides the error banner
    function hideError() {
        document.getElementById("errorBanner").classList.add("hidden");
    }

    // Displays validation messages near the input
    function showValidation(message) {
        document.getElementById("validationMessage").textContent = message;
    }

    // Clears validation messages
    function clearValidation() {
        document.getElementById("validationMessage").textContent = "";
    }

    // Resets UI elements to default waiting states
    function resetWeatherUI() {
        document.getElementById("cityName").textContent = "Loading city...";
        document.getElementById("weatherDescription").textContent = "Loading weather...";
        document.getElementById("weatherIcon").textContent = "⏳";
        document.getElementById("temperature").textContent = "--°C";
        document.getElementById("humidity").textContent = "--%";
        document.getElementById("windSpeed").textContent = "-- km/h";
        document.getElementById("localTime").textContent = "--:--";

        document.querySelectorAll(".forecast-card").forEach((card) => {
            card.querySelector(".forecast-day").textContent = "Loading";
            card.querySelector(".forecast-icon").textContent = "⏳";
            card.querySelector(".forecast-temp").textContent = "--° / --°";
        });
    }

    // --- Data Processing Functions ---

    // Gets weather description and icon from lookup table
    function getWeatherMeta(code) {
        return weatherCodeMap[code] || { text: "Unknown weather", icon: "❔" };
    }

    // Formats a date string into a short weekday name (e.g., "Mon")
    function formatDayName(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { weekday: "short" });
    }

    // Extracts relative humidity for the current hour
    function getHumidityForCurrentHour(weatherData) {
        const currentTime = weatherData.current_weather.time;
        const hourlyTimes = weatherData.hourly.time;
        const humidityValues = weatherData.hourly.relativehumidity_2m;

        const index = hourlyTimes.indexOf(currentTime);
        if (index === -1) {
            return "--";
        }

        return humidityValues[index];
    }

    // Converts Celsius to Fahrenheit
    function convertCtoF(tempC) {
        return (tempC * 9) / 5 + 32;
    }

    // Formats temperature based on the selected unit
    function formatTemperature(tempC) {
        if (appState.unit === "F") {
            return `${Math.round(convertCtoF(tempC))}°F`;
        }

        return `${Math.round(tempC)}°C`;
    }

    // Populates the current weather UI section
    function populateCurrentWeather(cityName, weatherData) {
        const current = weatherData.current_weather;
        const humidity = getHumidityForCurrentHour(weatherData);
        const weatherMeta = getWeatherMeta(current.weathercode);

        document.getElementById("cityName").textContent = cityName;
        document.getElementById("weatherDescription").textContent = weatherMeta.text;
        document.getElementById("weatherIcon").textContent = weatherMeta.icon;
        document.getElementById("temperature").textContent = formatTemperature(current.temperature);
        document.getElementById("humidity").textContent = `${humidity}%`;
        document.getElementById("windSpeed").textContent = `${Math.round(current.windspeed)} km/h`;
    }

    // Populates the 7-day forecast UI section
    function populateForecast(weatherData) {
        const days = weatherData.daily.time;
        const maxTemps = weatherData.daily.temperature_2m_max;
        const minTemps = weatherData.daily.temperature_2m_min;
        const codes = weatherData.daily.weathercode;
        const cards = document.querySelectorAll(".forecast-card");

        cards.forEach((card, index) => {
            const dayName = formatDayName(days[index]);
            const weatherMeta = getWeatherMeta(codes[index]);

            card.querySelector(".forecast-day").textContent = dayName;
            card.querySelector(".forecast-icon").textContent = weatherMeta.icon;
            card.querySelector(".forecast-temp").textContent =
                `${formatTemperature(maxTemps[index])} / ${formatTemperature(minTemps[index])}`;
        });
    }

    // Retrieves browser's local time string, formatting it consistently (HH:MM)
    function getBrowserLocalTime() {
        const date = new Date();
        return date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    // --- API and Fetch Functions ---

    // Fetch helper with AbortController for 10s timeout
    async function fetchJsonWithTimeout(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
            const response = await fetch(url, { signal: controller.signal });

            if (!response.ok) {
                // Explicit HTTP error handling
                throw new Error(`HTTP error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            // Check if error is due to abort timeout
            if (error.name === "AbortError") {
                throw new Error("Request timed out. Please try again.");
            }
            throw error; // Re-throw other errors (e.g., network errors, HTTP errors)
        } finally {
            clearTimeout(timeoutId); // Clean up the timer
        }
    }

    // --- Feature logic ---

    // Validates city input length
    function validateCityInput(city) {
        if (!city || city.trim().length < 2) {
            showValidation("Please enter at least 2 characters.");
            return false;
        }

        clearValidation();
        return true;
    }

    // Triggers search from input data
    function triggerSearchFromInput() {
        const city = document.getElementById("cityInput").value.trim();

        if (!validateCityInput(city)) {
            return;
        }

        searchWeather(city);
    }

    // Loads recent searches from localStorage
    function loadRecentSearches() {
        const saved = localStorage.getItem("weathernowRecentSearches");

        if (saved) {
            appState.recentSearches = JSON.parse(saved);
        }

        renderRecentSearches();
    }

    // Saves search term to localStorage
    function saveRecentSearch(city) {
        const normalizedCity = city.trim();

        // Remove duplicate if it exists to bring it to the front
        appState.recentSearches = appState.recentSearches.filter(
            (item) => item.toLowerCase() !== normalizedCity.toLowerCase()
        );

        appState.recentSearches.unshift(normalizedCity);
        appState.recentSearches = appState.recentSearches.slice(0, 5);

        localStorage.setItem(
            "weathernowRecentSearches",
            JSON.stringify(appState.recentSearches)
        );

        renderRecentSearches();
    }

    // Renders recent search chips
    function renderRecentSearches() {
        const container = document.getElementById("recentSearches");
        container.innerHTML = "";

        appState.recentSearches.forEach((city) => {
            const button = document.createElement("button");
            button.textContent = city;
            button.className = "recent-chip";

            button.addEventListener("click", () => {
                document.getElementById("cityInput").value = city;
                searchWeather(city);
            });

            container.appendChild(button);
        });
    }

    // Main weather search function chaining API requests
    async function searchWeather(city) {
        appState.lastSearchedCity = city;
        document.getElementById("cityInput").value = city;
        saveRecentSearch(city);
        hideError();
        clearValidation();
        resetWeatherUI();
        addAllSkeletons();

        try {
            // Call Geocoding API first
            const geocodingUrl =
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

            const geoData = await fetchJsonWithTimeout(geocodingUrl);

            // If no results, show validation instead of throwing error
            if (!geoData.results || geoData.results.length === 0) {
                removeAllSkeletons();
                showValidation("City not found. Please try another city.");
                return;
            }

            const place = geoData.results[0];
            const latitude = place.latitude;
            const longitude = place.longitude;
            const resolvedName = `${place.name}${place.country ? `, ${place.country}` : ""}`;

            appState.lastResolvedTimezone = place.timezone || "";

            // Chain Open-Meteo forecast call using resolved coordinates
            const weatherUrl =
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
                `&current_weather=true` +
                `&hourly=temperature_2m,relativehumidity_2m,windspeed_10m` +
                `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
                `&timezone=auto`;

            const weatherData = await fetchJsonWithTimeout(weatherUrl);
            appState.lastWeatherData = weatherData;
            appState.lastResolvedName = resolvedName;

            populateCurrentWeather(resolvedName, weatherData);
            populateForecast(weatherData);

            // Fetch local time using jQuery (Requirements: Task 3)
            fetchLocalTime(appState.lastResolvedTimezone);

            removeAllSkeletons();
        } catch (error) {
            removeAllSkeletons();
            showError(error.message || "Network error. Please try again.");
        }
    }

    // jQuery fetch implementation for local time
    function fetchLocalTime(timezone) {
        if (!timezone) {
            $("#localTime").text(getBrowserLocalTime());
            return;
        }

        const url = `https://timeapi.io/api/Time/current/zone?timeZone=${encodeURIComponent(timezone)}`;

        // Using $.getJSON() as specified in the lab instructions
        $.getJSON(url)
            .done(function (data) {
                const time = data.time || getBrowserLocalTime();
                $("#localTime").text(time);
            })
            .fail(function () {
                // Fallback to browser's local time if request fails
                $("#localTime").text(getBrowserLocalTime());
            })
            .always(function () {
                // Log timestamp of completed request
                console.log(`Local time request finished at: ${new Date().toISOString()}`);
            });
    }

    // --- Event Listeners ---

    // Search button click
    document.getElementById("searchBtn").addEventListener("click", () => {
        triggerSearchFromInput();
    });

    // Input debounce for typing
    document.getElementById("cityInput").addEventListener("input", () => {
        const city = document.getElementById("cityInput").value.trim();

        if (appState.debounceTimer) {
            clearTimeout(appState.debounceTimer);
        }

        // Pre-validation to avoid delayed error message
        if (!city) {
            showValidation("Please enter at least 2 characters.");
            return;
        }

        appState.debounceTimer = setTimeout(() => {
            if (validateCityInput(city)) {
                searchWeather(city);
            }
        }, 500); // 500ms debounce delay
    });

    // Enter key press in search bar
    document.getElementById("cityInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            if (appState.debounceTimer) {
                clearTimeout(appState.debounceTimer);
            }

            triggerSearchFromInput();
        }
    });

    // Retry button on error banner
    document.getElementById("retryBtn").addEventListener("click", () => {
        if (appState.lastSearchedCity) {
            searchWeather(appState.lastSearchedCity);
        }
    });

    // Unit toggle: Celsius
    document.getElementById("celsiusBtn").addEventListener("click", () => {
        appState.unit = "C";
        document.getElementById("celsiusBtn").classList.add("active-unit");
        document.getElementById("fahrenheitBtn").classList.remove("active-unit");

        if (appState.lastWeatherData) {
            populateCurrentWeather(appState.lastResolvedName, appState.lastWeatherData);
            populateForecast(appState.lastWeatherData);
        }
    });

    // Unit toggle: Fahrenheit
    document.getElementById("fahrenheitBtn").addEventListener("click", () => {
        appState.unit = "F";
        document.getElementById("fahrenheitBtn").classList.add("active-unit");
        document.getElementById("celsiusBtn").classList.remove("active-unit");

        if (appState.lastWeatherData) {
            populateCurrentWeather(appState.lastResolvedName, appState.lastWeatherData);
            populateForecast(appState.lastWeatherData);
        }
    });

    // Initialize application
    loadRecentSearches();
    console.log("WeatherNow app initialized");
});