const appState = {
    lastSearchedCity: "",
    lastResolvedTimezone: "",
};

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

function removeAllSkeletons() {
    document.querySelectorAll(".skeleton").forEach((element) => {
        element.classList.remove("skeleton");
    });
}

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

function showError(message) {
    const banner = document.getElementById("errorBanner");
    const text = document.getElementById("errorText");
    text.textContent = message;
    banner.classList.remove("hidden");
}

function hideError() {
    document.getElementById("errorBanner").classList.add("hidden");
}

function showValidation(message) {
    document.getElementById("validationMessage").textContent = message;
}

function clearValidation() {
    document.getElementById("validationMessage").textContent = "";
}

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

function getWeatherMeta(code) {
    return weatherCodeMap[code] || { text: "Unknown weather", icon: "❔" };
}

function formatDayName(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "short" });
}

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

function populateCurrentWeather(cityName, weatherData) {
    const current = weatherData.current_weather;
    const humidity = getHumidityForCurrentHour(weatherData);
    const weatherMeta = getWeatherMeta(current.weathercode);

    document.getElementById("cityName").textContent = cityName;
    document.getElementById("weatherDescription").textContent = weatherMeta.text;
    document.getElementById("weatherIcon").textContent = weatherMeta.icon;
    document.getElementById("temperature").textContent = `${Math.round(current.temperature)}°C`;
    document.getElementById("humidity").textContent = `${humidity}%`;
    document.getElementById("windSpeed").textContent = `${Math.round(current.windspeed)} km/h`;
}

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
            `${Math.round(maxTemps[index])}° / ${Math.round(minTemps[index])}°`;
    });
}

async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }

    return response.json();
}

async function searchWeather(city) {
    appState.lastSearchedCity = city;
    hideError();
    clearValidation();
    resetWeatherUI();
    addAllSkeletons();

    try {
        const geocodingUrl =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const geoData = await fetchJson(geocodingUrl);

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

        const weatherUrl =
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
            `&current_weather=true` +
            `&hourly=temperature_2m,relativehumidity_2m,windspeed_10m` +
            `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
            `&timezone=auto`;

        const weatherData = await fetchJson(weatherUrl);

        populateCurrentWeather(resolvedName, weatherData);
        populateForecast(weatherData);
        removeAllSkeletons();
    } catch (error) {
        removeAllSkeletons();
        showError(error.message || "Network error. Please try again.");
    }
}

document.getElementById("searchBtn").addEventListener("click", () => {
    const city = document.getElementById("cityInput").value.trim();

    if (city.length < 2) {
        showValidation("Please enter at least 2 characters.");
        return;
    }

    searchWeather(city);
});

document.getElementById("retryBtn").addEventListener("click", () => {
    if (appState.lastSearchedCity) {
        searchWeather(appState.lastSearchedCity);
    }
});

console.log("WeatherNow app initialized");