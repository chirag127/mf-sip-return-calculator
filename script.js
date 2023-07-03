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

        // Set default values for start and end dates
        const endDate = mutualFundDetails.data[0].date;
        const startDate = mutualFundDetails.data[mutualFundDetails.data.length - 1].date;

        // Set the default values in the date inputs
        startDateInput.value = startDate;
        endDateInput.value = endDate;

        // Display the mutual fund details and show the date range container
        displaySelectedMutualFund(mutualFundDetails);
        showDateRangeContainer();
      })
      .catch(error => {
        console.log('Error:', error);
        resultsContainer.textContent = 'Failed to fetch mutual fund details. Please try again.';
      });
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

        // Filter performance data based on the selected date range
        const filteredData = performanceData.filter(item => {
          const date = new Date(item.date);
          return date >= new Date(startDate) && date <= new Date(endDate);
        });

        // Calculate CAGR
        const initialNav = parseFloat(filteredData[0].nav);
        const finalNav = parseFloat(filteredData[filteredData.length - 1].nav);
        const numberOfYears = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24 * 365);
        const cagr = ((Math.pow(finalNav / initialNav, 1 / numberOfYears)) - 1) * 100;

        // Calculate absolute return
        const absoluteReturn = ((finalNav - initialNav) / initialNav) * 100;

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
      <ul>
        <li><strong>CAGR:</strong> ${cagr}%</li>
        <li><strong>Absolute Return:</strong> ${absoluteReturn}%</li>
        <!-- Add more metrics as needed -->
      </ul>
    `;
  }
