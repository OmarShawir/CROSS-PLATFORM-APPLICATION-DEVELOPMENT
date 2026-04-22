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

    document.querySelectorAll(".forecast-day, .forecast-icon, .forecast-temp").forEach((el) => {
        el.classList.add("skeleton");
    });
}

console.log("WeatherNow app initialized");