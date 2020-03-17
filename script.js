$(document).ready(function() {
  // On click event for when the search button is clicked
  $("#search-button").on("click", function() {
    // Grab the text from the input box
    var searchValue = $("#search-value").val();
    searchValue = titleCase(searchValue);

    // clear input box
    $("#search-value").val("");

    // Call the function to search for weather based on what was entered in the input box
    searchWeather(searchValue);
  });

  // When a city that's listed in the history section is clicked, search based on that city's name
  $(".history").on("click", "li", function() {
    searchWeather($(this).text());
  });
  
  // Creates a new list item to add to the history section
  function makeRow(text) {
    var li = $("<li>").addClass("list-group-item list-group-item-action").text(text);
    $(".history").append(li);
  }

  // Function to use the Weather API to get the weather for city name that is passed in.
  function searchWeather(searchValue) {
    // Build an ajax call to interact with the Weather API
    $.ajax({
      type: "GET",
      url: "https://api.openweathermap.org/data/2.5/weather?q=" + searchValue + "&appid=600327cb1a9160fea2ab005509d1dc6d&units=imperial",
      dataType: "json",
      success: function(data) {
        // create history link for this search if the city is not already in the list.
        if (history.indexOf(searchValue) === -1) {
          history.push(searchValue);
          //Save updated history to local storage
          window.localStorage.setItem("history", JSON.stringify(history));
          // Add the newly updated city to the list on screen
          makeRow(searchValue);
        }
        
        // clear any old content
        $("#today").empty();

        // create html content for current weather
        // Create a header tag to hold the name of the city and the current date
        var title = $("<h3>").addClass("card-title").text(data.name + " (" + new Date().toLocaleDateString() + ")");
        // Create a card div to hold the card text
        var card = $("<div>").addClass("card");
        // Create a paragraph tag to hold the wind speed
        var wind = $("<p>").addClass("card-text").text("Wind Speed: " + data.wind.speed + " MPH");
        // Create a paragraph tag to hold the humidity data
        var humid = $("<p>").addClass("card-text").text("Humidity: " + data.main.humidity + "%");
        // Create a paragraph tag to display temperature data in Fahrenheit
        var temp = $("<p>").addClass("card-text").text("Temperature: " + data.main.temp + " °F");
        // Create a div to hold the weather information
        var cardBody = $("<div>").addClass("card-body");
        // Create an image that displays an icon that represents the weather
        var img = $("<img>").attr("src", "https://openweathermap.org/img/w/" + data.weather[0].icon + ".png");

        // merge and add to page
        // Add the image to the header
        title.append(img);
        // Add all of the weather information to the cardBody div tag
        cardBody.append(title, temp, humid, wind);
        // Add the cardBody to the card div
        card.append(cardBody);
        // Add the card to the section for today's weather
        $("#today").append(card);

        // call follow-up api endpoints
        // Call a function to display the five day forecast
        getForecast(searchValue);
        // Call a function to display the UV Index
        getUVIndex(data.coord.lat, data.coord.lon);
      },
      // Added code to alert user if they entered an invalid search term.
      error: function (jqXHR, exception){
        // If the error was because of a 404: not found error, alert the user.
        if(jqXHR.status === 404){
          alert("Could not find that city! Please try entering another one.");
        }
      }
    });
  }
  
  // A function that displays the five day forecast for the given city
  function getForecast(searchValue) {
    // Build ajax call to weather API for the forecast endpoint
    $.ajax({
      type: "GET",
      url: "https://api.openweathermap.org/data/2.5/forecast?q=" + searchValue + "&appid=600327cb1a9160fea2ab005509d1dc6d&units=imperial",
      dataType: "json",
      success: function(data) {
        // overwrite any existing content with title and empty row
        $("#forecast").html("<h4 class=\"mt-3\">5-Day Forecast:</h4>").append("<div class=\"row\">");

        // loop over all forecasts (by 3-hour increments)
        for (var i = 0; i < data.list.length; i++) {
          // only look at forecasts around 3:00pm
          if (data.list[i].dt_txt.indexOf("15:00:00") !== -1) {
            // create html elements for a bootstrap card
            var col = $("<div>").addClass("col-md-2");
            var card = $("<div>").addClass("card bg-primary text-white");
            var body = $("<div>").addClass("card-body p-2");

            // Add data to card elements
            // Add the corresponding date to each forecast card
            var title = $("<h5>").addClass("card-title").text(new Date(data.list[i].dt_txt).toLocaleDateString());
            // Add an icon that corresponds to the weather for the day
            var img = $("<img>").attr("src", "https://openweathermap.org/img/w/" + data.list[i].weather[0].icon + ".png");
            // Create paragraph elements with the temperature and humidity data for the day
            var p1 = $("<p>").addClass("card-text").text("Temp: " + data.list[i].main.temp_max + " °F");
            var p2 = $("<p>").addClass("card-text").text("Humidity: " + data.list[i].main.humidity + "%");

            // merge together and put on page
            col.append(card.append(body.append(title, img, p1, p2)));
            $("#forecast .row").append(col);
          }
        }
      }
    });
  }

  // Function to display the UV Index for the given location
  function getUVIndex(lat, lon) {
    // Build ajax call to the weather API for the UV Index endpoint
    $.ajax({
      type: "GET",
      url: "https://api.openweathermap.org/data/2.5/uvi?appid=600327cb1a9160fea2ab005509d1dc6d&lat=" + lat + "&lon=" + lon,
      dataType: "json",
      success: function(data) {
        // Create some html elements to hold the UV Index data
        var uv = $("<p>").text("UV Index: ");
        var btn = $("<span>").addClass("btn btn-sm").text(data.value);
        
        // change color depending on uv value: Green for low, yellow for medium, red for high.
        if (data.value < 3) {
          btn.addClass("btn-success");
        }
        else if (data.value < 7) {
          btn.addClass("btn-warning");
        }
        else {
          btn.addClass("btn-danger");
        }
        // Add the UV Index to the card holding the current date's weather information
        $("#today .card-body").append(uv.append(btn));
      }
    });
  }

  // Create function to format input so that it's titleCase, where only the first character is uppercase.
  function titleCase(city){
    // Set the entire string to lowercase
    var lower = city.toLowerCase();
    // Then set just the first character to uppercase and append the rest.
    var formatted = lower.charAt(0).toUpperCase() + lower.slice(1);
    return formatted;
  }

  // get current history, if any
  var history = JSON.parse(window.localStorage.getItem("history")) || [];

  // If the history isn't empty, display the weather data for the most recently searched city
  if (history.length > 0) {
    searchWeather(history[history.length-1]);
  }

  // Add rows for each city in the history to the page
  for (var i = 0; i < history.length; i++) {
    makeRow(history[i]);
  }
});
