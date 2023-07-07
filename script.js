const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");
const mutualFundContainer = document.getElementById("mutual-fund-container");
const fundDetailsContainer = document.getElementById("fund-details");
const performanceMetricsContainer = document.getElementById(
  "performance-metrics"
);
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");

const dailySipReturnBtn = document.getElementById("daily-sip-return-btn");
const lumpsumReturnBtn = document.getElementById("lumpsum-return-btn");
const investmentOnDipBtn = document.getElementById("investment-on-dip-btn");
const investmentOnUpBtn = document.getElementById("investment-on-up-btn");

const resetBtn = document.getElementById("reset-btn");

const resultsContainer = document.getElementById("results-container");

let mutualFundsData = []; // Store the mutual funds data locally
let selectedSchemeCode = null; // Store the selected scheme code
let mutualFundDetails = null; // Store the mutual fund details
// let startDate = null; // Store the start date
// let endDate = null; // Store the end date

// Fetch mutual funds data when the page loads
fetch("https://api.mfapi.in/mf")
  .then((response) => response.json())
  .then((data) => {
    mutualFundsData = data;
  });

// Event listener for search input
searchInput.addEventListener("input", () => {
  const searchQuery = searchInput.value.trim().toLowerCase();
  if (searchQuery.length > 0) {
    const searchResultsData = mutualFundsData.filter((fund) =>
      fund.schemeName.toLowerCase().includes(searchQuery)
    );
    displaySearchResults(searchResultsData);
  } else {
    searchResults.innerHTML = "";
  }
});

// Display search results
function displaySearchResults(results) {
  searchResults.innerHTML = "";

  if (results.length === 0) {
    const noResults = document.createElement("div");
    noResults.textContent = "No results found.";
    searchResults.appendChild(noResults);
  } else {
    results.forEach((result) => {
      const button = document.createElement("button");
      button.textContent = `${result.schemeName}`;
      button.addEventListener("click", () => {
        selectedSchemeCode = result.schemeCode;
        fetchMutualFundDetails(selectedSchemeCode);

        // Hide the search results and clear the search input
        searchResults.innerHTML = "";
      });
      searchResults.appendChild(button);
    });
  }
}
// Fetch mutual fund details
function fetchMutualFundDetails(schemeCode) {
  fetch(`https://api.mfapi.in/mf/${schemeCode}`)
    .then((response) => response.json())
    .then((data) => {
      mutualFundDetails = data;
      setDefaultDates(mutualFundDetails);
      displaySelectedMutualFund(mutualFundDetails);

      // Fetch performance data
    })
    .catch((error) => {
      console.log("Error:", error);
      resultsContainer.textContent =
        "Failed to fetch mutual fund details. Please try again.";
    });
}

// Set default values for start and end dates with format {"date":"22-05-2008","nav":"10.71360"}
function setDefaultDates(mutualFundDetails) {
  const endDate = convertDateFormat(mutualFundDetails.data[0].date);
  const startDate = convertDateFormat(
    mutualFundDetails.data[mutualFundDetails.data.length - 1].date
  );

  // Set the default values in the date inputs
  startDateInput.value = startDate;
  endDateInput.value = endDate;

  // Hide the date range container
  hideDateRangeContainer();

  // Show the date range container
  showDateRangeContainer();
}

// Convert date format from "dd-MM-yyyy" to "yyyy-MM-dd"
function convertDateFormat(dateString) {
  const parts = dateString.split("-");
  const day = parts[0];
  const month = parts[1];
  const year = parts[2];
  return `${year}-${month}-${day}`;
}

// Display selected mutual fund details
function displaySelectedMutualFund(data) {
  fundDetailsContainer.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = data.meta.scheme_name;
  fundDetailsContainer.appendChild(heading);

  // Display other relevant details of the fund
  const fundDetails = document.createElement("div");
  fundDetails.innerHTML = `
    <strong>Fund House:</strong> ${data.meta.fund_house}<br>
    <strong>Scheme Type:</strong> ${data.meta.scheme_type}<br>
    <strong>Scheme Category:</strong> ${data.meta.scheme_category}<br>
    <strong>Scheme Code:</strong> ${data.meta.scheme_code}<br>
  `;
  fundDetailsContainer.appendChild(fundDetails);
}

function changeDateFormat(performanceData) {
  performanceData.forEach((item) => {
    item.date = convertDateFormat(item.date);
  });
}

// Filter performance data based on the selected date range,
// start date and end date are in the format "yyyy-MM-dd"
function filterPerformanceData(performanceData, startDate, endDate) {
  const filteredData = performanceData.filter((item) => {
    const date = new Date(item.date);
    // Filter the data based on the selected date range
    return date >= new Date(startDate) && date <= new Date(endDate);
  });
  return filteredData;
}

// Add the missing dates in the selected date range to the filteredData array
function addMissingDates(filteredData, startDate, endDate) {
  newDatesArray = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (var d = start; d <= end; d.setDate(d.getDate() + 1)) {
    newDatesArray.push(new Date(d).toISOString().slice(0, 10));
  }
  // Create an array of dates in the filteredData array
  existingDatesArray = [];
  filteredData.forEach((item) => {
    existingDatesArray.push(item.date);
  });
  // Find the missing dates in the selected date range
  missingDatesArray = newDatesArray.filter(
    (item) => !existingDatesArray.includes(item)
  );
  // Add the missing dates in the selected date range to the filteredData array
  missingDatesArray.forEach((item) => {
    const previousNav = filteredData[filteredData.length - 1].nav;
    // remember to change the date format from "dd-MM-yyyy" to "yyyy-MM-dd" if you are using the API to get the data
    filteredData.push({ date: item, nav: previousNav });
  });
}

// Calculate total units at end date assuming a fixed investment amount of 1000 rupee per installment
function calculateTotalUnits(filteredData) {
  var totalUnits = 0;
  filteredData.forEach((item) => {
    totalUnits += 1000 / item.nav;
  });
  return totalUnits;
}

// Show the date range container
function showDateRangeContainer() {
  const dateRangeContainer = document.querySelector(".date-range-container");
  dateRangeContainer.style.display = "block";
}

// Hide the date range container
function hideDateRangeContainer() {
  const dateRangeContainer = document.querySelector(".date-range-container");
  dateRangeContainer.style.display = "none";
}

// Event listener for calculate button
dailySipReturnBtn.addEventListener("click", () => {
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  if (startDate && endDate) {
    calculatedailySipReturn(startDate, endDate);
  } else {
    resultsContainer.textContent = "Please select both start and end dates.";
  }
});

function calculatedailySipReturn(startDate, endDate) {
  try {
    performanceData = mutualFundDetails.data;
    console.log(performanceData);
    // performanceData is an array of objects with the following structure: {"date":"22-05-2008","nav":"10.71360"},{"date":"23-05-2008","nav":"10.71360"}

    // Change the date format from "dd-MM-yyyy" to "yyyy-MM-dd"
    changeDateFormat(performanceData);

    // Filter performance data based on the selected date range
    const filteredData = filterPerformanceData(
      performanceData,
      startDate,
      endDate
    );

    // Add the missing dates in the selected date range to the filteredData array
    addMissingDates(filteredData, startDate, endDate);

    // Sort the filteredData array based on date
    filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
    console.log(filteredData);

    // Calculate total units at end date assuming a fixed investment amount of 1000 rupee per installment
    var totalUnits = calculateTotalUnits(filteredData);

    // Calculate total investment amount
    const totalInvestment = filteredData.length * 1000;

    // Calculate absolute return amount
    const absoluteReturnAmount =
      totalUnits * filteredData[filteredData.length - 1].nav - totalInvestment;
    console.log(absoluteReturnAmount);

    // Calculate absolute return percentage
    const absoluteReturn = (absoluteReturnAmount / totalInvestment) * 100;

    // Calculate CAGR
    const cagr =
      Math.pow(
        totalUnits / (totalInvestment / 1000),
        365 / filteredData.length
      ) - 1;

    // Display the calculated returns
    displayReturns(cagr.toFixed(2), absoluteReturn.toFixed(2));
  } catch (error) {
    console.log(error);
    resultsContainer.textContent = "Please select both start and end dates.";
  }
}

lumpsumReturnBtn.addEventListener("click", () => {
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  if (startDate && endDate) {
    calculateLumpsumReturn(startDate, endDate);
  } else {
    resultsContainer.textContent = "Please select both start and end dates.";
  }
});

function calculateLumpsumReturn(startDate, endDate) {
  try {
    performanceData = mutualFundDetails.data;
    // performanceData is an array of objects with the following structure: {"date":"22-05-2008","nav":"10.71360"},{"date":"23-05-2008","nav":"10.71360"}

    // Change the date format from "dd-MM-yyyy" to "yyyy-MM-dd"
    changeDateFormat(performanceData);

    // Filter performance data based on the selected date range
    const filteredData = filterPerformanceData(
      performanceData,
      startDate,
      endDate
    );

    // Sort the filteredData array based on date
    filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(filteredData);

    // Calculate total units at end date assuming a fixed investment amount of 1000 rupee of lumpsum only once at the start date
    var totalUnits = 1000 / filteredData[0].nav;

    // Calculate total investment amount
    const totalInvestment = 1000;

    // Calculate absolute return amount
    const absoluteReturnAmount =
      totalUnits * filteredData[filteredData.length - 1].nav - totalInvestment;
    console.log(absoluteReturnAmount);

    // Calculate absolute return percentage
    const absoluteReturn = (absoluteReturnAmount / totalInvestment) * 100;

    // Calculate CAGR
    const cagr =
      Math.pow(
        totalUnits / (totalInvestment / 1000),
        365 / filteredData.length
      ) - 1;

    // Display the calculated returns

    displayReturns(cagr.toFixed(2), absoluteReturn.toFixed(2));
  } catch (error) {
    console.log(error);

    resultsContainer.textContent = "Please select both start and end dates.";
  }
}

investmentOnDipBtn.addEventListener("click", () => {
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  if (startDate && endDate) {
    calculateInvestmentOnDip(startDate, endDate);
  } else {
    resultsContainer.textContent = "Please select both start and end dates.";
  }
});

function calculateInvestmentOnDip(startDate, endDate) {
  try {
    performanceData = mutualFundDetails.data;
    console.log(performanceData);
    // performanceData is an array of objects with the following structure: {"date":"22-05-2008","nav":"10.71360"},{"date":"23-05-2008","nav":"10.71360"}

    // Change the date format from "dd-MM-yyyy" to "yyyy-MM-dd"
    changeDateFormat(performanceData);

    // Filter performance data based on the selected date range
    const filteredData = filterPerformanceData(
      performanceData,
      startDate,
      endDate
    );

    // Sort the filteredData array based on date

    filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate total units at end date assuming a fixed investment amount of 1000 rupee
    // investment on every dip of any amount
    var totalUnits = 0;
    var totalInvestmentAmount = 0;

    for (var i = 0; i < filteredData.length - 1; i++) {
      if (filteredData[i + 1].nav < filteredData[i].nav) {
        totalUnits += 1000 / filteredData[i + 1].nav;
        totalInvestmentAmount += 1000;
      }
    }

    // Calculate total investment amount
    const totalInvestment = totalInvestmentAmount;

    // Calculate absolute return amount

    const absoluteReturnAmount =
      totalUnits * filteredData[filteredData.length - 1].nav - totalInvestment;

    console.log(absoluteReturnAmount);

    // Calculate absolute return percentage

    const absoluteReturn = (absoluteReturnAmount / totalInvestment) * 100;

    // Calculate CAGR

    const cagr =
      Math.pow(
        totalUnits / (totalInvestment / 1000),
        365 / filteredData.length
      ) - 1;

    // Display the calculated returns

    displayReturns(cagr.toFixed(2), absoluteReturn.toFixed(2));
  } catch (error) {
    console.log(error);

    resultsContainer.textContent = "Please select both start and end dates.";
  }
}

investmentOnUpBtn.addEventListener("click", () => {
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  if (startDate && endDate) {
    calculateInvestmentOnUp(startDate, endDate);
  } else {
    resultsContainer.textContent = "Please select both start and end dates.";
  }
});

function calculateInvestmentOnUp(startDate, endDate) {
  try {
    performanceData = mutualFundDetails.data;
    console.log(performanceData);
    // performanceData is an array of objects with the following structure: {"date":"22-05-2008","nav":"10.71360"},{"date":"23-05-2008","nav":"10.71360"}

    // Change the date format from "dd-MM-yyyy" to "yyyy-MM-dd"
    changeDateFormat(performanceData);

    // Filter performance data based on the selected date range
    const filteredData = filterPerformanceData(
      performanceData,
      startDate,
      endDate
    );

    // Sort the filteredData array based on date

    filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate total units at end date assuming a fixed investment amount of 1000 rupee

    // investment on every up of any amount

    var totalUnits = 0;

    var totalInvestmentAmount = 0;

    for (var i = 0; i < filteredData.length - 1; i++) {
      if (filteredData[i + 1].nav > filteredData[i].nav) {
        totalUnits += 1000 / filteredData[i + 1].nav;

        totalInvestmentAmount += 1000;
      }
    }

    // Calculate total investment amount

    const totalInvestment = totalInvestmentAmount;

    // Calculate absolute return amount

    const absoluteReturnAmount =
      totalUnits * filteredData[filteredData.length - 1].nav - totalInvestment;

    console.log(absoluteReturnAmount);

    // Calculate absolute return percentage

    const absoluteReturn = (absoluteReturnAmount / totalInvestment) * 100;

    // Calculate CAGR

    const cagr =
      Math.pow(
        totalUnits / (totalInvestment / 1000),
        365 / filteredData.length
      ) - 1;

    // Display the calculated returns

    displayReturns(cagr.toFixed(2), absoluteReturn.toFixed(2));
  } catch (error) {
    console.log(error);

    resultsContainer.textContent = "Please select both start and end dates.";
  }
}

// Display the calculated returns
function displayReturns(cagr, absoluteReturn) {
  performanceMetricsContainer.innerHTML = `
      <h3>Performance Metrics:</h3>

        <strong>CAGR:</strong> ${cagr}%<br>
        <strong>Absolute Return:</strong> ${absoluteReturn}%<br>

    <!-- Add more metrics<strong>Sharpe Ratio:</strong> <br>
        <strong>Sortino Ratio:</strong> <br>
        <strong>Alpha:</strong> <br>
        <strong>Beta:</strong> <br>
  -->


    `;
}
