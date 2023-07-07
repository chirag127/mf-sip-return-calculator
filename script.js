const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const mutualFundContainer = document.getElementById('mutual-fund-container');
const fundDetailsContainer = document.getElementById('fund-details');
const performanceMetricsContainer = document.getElementById('performance-metrics');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const calculateButton = document.getElementById('calculate-button');
const resultsContainer = document.getElementById('results-container');

let mutualFundsData = []; // Store the mutual funds data locally
let selectedSchemeCode = null;

// Fetch mutual funds data when the page loads
fetch('https://api.mfapi.in/mf')
  .then(response => response.json())
  .then(data => {
    mutualFundsData = data;
  });

// Event listener for search input
searchInput.addEventListener('input', () => {
  const searchQuery = searchInput.value.trim().toLowerCase();
  if (searchQuery.length > 0) {
    const searchResultsData = mutualFundsData.filter(fund =>
      fund.schemeName.toLowerCase().includes(searchQuery)
    );
    displaySearchResults(searchResultsData);
  } else {
    searchResults.innerHTML = '';
  }
});

// Display search results
function displaySearchResults(results) {
  searchResults.innerHTML = '';

  if (results.length === 0) {
    const noResults = document.createElement('div');
    noResults.textContent = 'No results found.';
    searchResults.appendChild(noResults);
  } else {
    results.forEach(result => {
      const button = document.createElement('button');
      button.textContent = `${result.schemeName}`;
      button.addEventListener('click', () => {
        selectedSchemeCode = result.schemeCode;
        fetchMutualFundDetails(selectedSchemeCode);

        // Hide the search results and clear the search input
        searchResults.innerHTML = '';

      });
      searchResults.appendChild(button);
    });
  }
}
// Fetch mutual fund details
function fetchMutualFundDetails(schemeCode) {
    fetch(`https://api.mfapi.in/mf/${schemeCode}`)
      .then(response => response.json())
      .then(data => {
        const mutualFundDetails = data;

        // Set default values for start and end dates with format {"date":"22-05-2008","nav":"10.71360"}
        const endDate = convertDateFormat(mutualFundDetails.data[0].date);
        const startDate = convertDateFormat(mutualFundDetails.data[mutualFundDetails.data.length - 1].date);

        // Set the default values in the date inputs
        startDateInput.value = startDate;

        // endDateInput.value =
        endDateInput.value = endDate;

        // Hide the date range container
        hideDateRangeContainer();



        // Display the mutual fund details and show the date range container
        displaySelectedMutualFund(mutualFundDetails);
        showDateRangeContainer();
      })
      .catch(error => {
        console.log('Error:', error);
        resultsContainer.textContent = 'Failed to fetch mutual fund details. Please try again.';
      });
  }

// Convert date format from "dd-MM-yyyy" to "yyyy-MM-dd"
function convertDateFormat(dateString) {
  const parts = dateString.split('-');
  const day = parts[0];
  const month = parts[1];
  const year = parts[2];
  return `${year}-${month}-${day}`;
}




// Display selected mutual fund details
function displaySelectedMutualFund(data) {
  fundDetailsContainer.innerHTML = '';

  const heading = document.createElement('h2');
  heading.textContent = data.meta.scheme_name;
  fundDetailsContainer.appendChild(heading);

  // Display other relevant details of the fund
  const fundDetails = document.createElement('div');
  fundDetails.innerHTML = `
    <strong>Fund House:</strong> ${data.meta.fund_house}<br>
    <strong>Scheme Type:</strong> ${data.meta.scheme_type}<br>
    <strong>Scheme Category:</strong> ${data.meta.scheme_category}<br>
    <strong>Scheme Code:</strong> ${data.meta.scheme_code}<br>
  `;
  fundDetailsContainer.appendChild(fundDetails);
}

// Show the date range container
function showDateRangeContainer() {
  const dateRangeContainer = document.querySelector('.date-range-container');
  dateRangeContainer.style.display = 'block';
}

// Hide the date range container
function hideDateRangeContainer() {
  const dateRangeContainer = document.querySelector('.date-range-container');
  dateRangeContainer.style.display = 'none';
}

// Event listener for calculate button
calculateButton.addEventListener('click', () => {
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  if (startDate && endDate) {
    calculateReturns(startDate, endDate);
  } else {
    resultsContainer.textContent = 'Please select both start and end dates.';
  }
});
// Calculate returns based on the selected date range
function calculateReturns(startDate, endDate) {
    // Call the API to get the mutual fund performance data
    fetch(`https://api.mfapi.in/mf/${selectedSchemeCode}`)
      .then(response => response.json())
      .then(data => {
        const performanceData = data.data;

        console.log(performanceData);
        // performanceData is an array of objects with the following structure: {"date":"22-05-2008","nav":"10.71360"},{"date":"23-05-2008","nav":"10.71360"}

        // change the date format from "dd-MM-yyyy" to "yyyy-MM-dd"

        performanceData.forEach(item => {

          item.date = convertDateFormat(item.date);

        });




        // Filter performance data based on the selected date range,
        // start date and end date are in the format "yyyy-MM-dd"


        const filteredData = performanceData.filter(item => {

          const date = new Date(item.date);


          // Filter the data based on the selected date range

          return date >= new Date(startDate) && date <= new Date(endDate);


        });



        newDatesArray = [];

        const start = new Date(startDate);

        const end = new Date(endDate);

        for (var d = start; d <= end; d.setDate(d.getDate() + 1)) {

            newDatesArray.push(new Date(d).toISOString().slice(0, 10));

        }

        // Create an array of dates in the filteredData array

        existingDatesArray = [];

        filteredData.forEach(item => {


            existingDatesArray.push(item.date);

        });

        // Find the missing dates in the selected date range

        missingDatesArray = newDatesArray.filter(item => !existingDatesArray.includes(item));

        // Add the missing dates in the selected date range to the filteredData array

        missingDatesArray.forEach(item => {

            const previousNav = filteredData[filteredData.length - 1].nav;


            // remember to change the date format from "dd-MM-yyyy" to "yyyy-MM-dd" if you are using the API to get the data

            filteredData.push({date: item, nav: previousNav});

        });



        // Sort the filteredData array based on date

        filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));

        console.log(filteredData);





        var totalUnits = 0;

        // Calculate total units at end date assuming a fixed investment amount of 1000 rupee per installment
        filteredData.forEach(item => {

            totalUnits += 1000 / item.nav;

        });



        // Calculate total investment amount

        const totalInvestment = filteredData.length * 1000;

        // Calculate absolute return amount

        const absoluteReturnAmount = totalUnits * filteredData[filteredData.length - 1].nav - totalInvestment;

        console.log(absoluteReturnAmount);

        // Calculate absolute return percentage

        const absoluteReturn = (absoluteReturnAmount / totalInvestment) * 100;

        // Calculate CAGR

        const cagr  = Math.pow((totalUnits / (totalInvestment / 1000)), (365 / filteredData.length)) - 1;

        // Display the calculated returns










        displayReturns(cagr.toFixed(2), absoluteReturn.toFixed(2));
      })
      .catch(error => {
        console.log('Error:', error);
        resultsContainer.textContent = 'Failed to calculate returns. Please try again.';
      });
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
