const apiUrl = 'http://localhost:5000/api/prices';

let priceChart;
const ctx = document.getElementById('priceChart').getContext('2d');
let currentCrypto = 'bitcoin';
let fetchInterval;

const cryptoData = {
  bitcoin: { labels: [], prices: [] },
  ethereum: { labels: [], prices: [] },
  litecoin: { labels: [], prices: [] },
  ripple: { labels: [], prices: [] }
};

// Function to get today's date in YYYY-MM-DD format
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Function to check if we should fetch real-time data (today's date or empty then fetch else not)
function shouldFetchRealTimeData(startDate, endDate) {
  const today = getTodayDate();
  return (!startDate && !endDate) || (startDate === today && endDate === today);
}

// Function to calculate price difference and percentage
function calculatePriceChange(startPrice, endPrice) {
  const priceDifference = endPrice - startPrice;
  const percentageChange = ((endPrice - startPrice) / startPrice) * 100;
  return { priceDifference, percentageChange };
}

// Function to update the chart with the latest data
function updateChart(crypto) {
  const data = cryptoData[crypto];

  // If a chart already exists, destroy it before creating a new one
  if (priceChart) {
    priceChart.destroy();
  }

  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: `${crypto.charAt(0).toUpperCase() + crypto.slice(1)} Prices`,
        data: data.prices,
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: false
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              const index = tooltipItem.dataIndex;
              const startPrice = data.prices[index - 1];
              const endPrice = data.prices[index];

              if (index === 0) {
                return `Price: $${endPrice.toFixed(2)}`;
              }

              const { priceDifference, percentageChange } = calculatePriceChange(startPrice, endPrice);
              const changeText = percentageChange > 0 ? `↑ +${percentageChange.toFixed(2)}%`: `↓ ${percentageChange.toFixed(2)}%`;

              return [
                `Price: $${endPrice.toFixed(2)}`,
                `Difference: $${priceDifference.toFixed(2)} (${changeText})`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Price (USD)'
          }
        }
      }
    }
  });
}

// Function to fetch crypto data from the API
async function fetchCryptoData(crypto) {
  try {
    const response = await fetch(`${apiUrl}?crypto=${crypto}`);
    const result = await response.json();
    const data = result.data;

    const currentTimestamp = new Date().toLocaleDateString();

    cryptoData[crypto].labels.push(currentTimestamp);
    cryptoData[crypto].prices.push(data.price);

    if (cryptoData[crypto].labels.length > 10) {
      cryptoData[crypto].labels.shift();
      cryptoData[crypto].prices.shift();
    }

    updateChart(crypto); // Updating the chart with the new data
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Tabs for all four cryptos
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', function () {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    this.classList.add('active');

    currentCrypto = this.dataset.crypto;
    fetchCryptoData(currentCrypto); // Fetchinging data for selected crypto immediately on tab switch (For all four tab)
  });
});

// Fetching data based on the selected date range
document.getElementById('fetchDataBtn').addEventListener('click', async () => {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (fetchInterval) {
    clearInterval(fetchInterval);
  }

  if (shouldFetchRealTimeData(startDate, endDate)) {
    // Real-time data fetching if dates are today or empty
    fetchCryptoData(currentCrypto);
    fetchInterval = setInterval(() => {
      fetchCryptoData(currentCrypto);
    }, 10000);
  } else {
    // Fetch historical data for the specified date range
    try {
      const response = await fetch(`${apiUrl}/${currentCrypto}?start=${startDate}&end=${endDate}`);
      const result = await response.json();

      const historicalData = result.data;
      const labels = historicalData.map(item => new Date(item.timestamp).toLocaleDateString()); // Show dates here
      const prices = historicalData.map(item => item.price);

      // Updating  the chart with historical data
      cryptoData[currentCrypto].labels = labels;
      cryptoData[currentCrypto].prices = prices;

      updateChart(currentCrypto);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  }
});

// Fetching crypto data
fetchCryptoData(currentCrypto);
fetchInterval = setInterval(() => {
  fetchCryptoData(currentCrypto);
}, 10000);
