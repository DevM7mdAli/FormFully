document.addEventListener('DOMContentLoaded', function () {
  //? getting the saved value to put it in input
  document.getElementById("auto").value = localStorage.getItem("defaultValue")

  //? saving value every time when user input something to the input
  document.getElementById("auto").addEventListener("input", function () {
    localStorage.setItem("defaultValue", this.value)
  })

  //! to begin execute the main functionality of the extension
  document.getElementById('fillButton').addEventListener('click', function () {
    const inputValue = document.getElementById('auto').value;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var activeTab = tabs[0];
      //! inject function to the page
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: fillFields,
        args: [inputValue]
      });
    });
  });
});
//* function to fill all input
function fillFields(inputValue) {
  const allInputs = document.getElementsByTagName('input')
  for (let i = 0; i < allInputs.length; i++) {
    //! To fill all visible input
    if (allInputs[i].type.toLowerCase() !== 'hidden') {
      //! for special cases
      if (allInputs[i].type === 'date') {
        allInputs[i].value = formatDate(new Date());
      } else if (allInputs[i].type === 'month') {
        allInputs[i].value = formatMonth(new Date());
      } else if (allInputs[i].type === 'datetime' || allInputs[i].type === 'datetime-local') {
        allInputs[i].value = formatDateTime(new Date());
      } else if (allInputs[i].type === 'week') {
        allInputs[i].value = formatWeek(new Date());
      } else if (allInputs[i].type === 'time') {
        allInputs[i].value = formatTime(new Date());
      }
      else if (allInputs[i].type === 'color') {
        allInputs[i].value = randomColor()
      }//! end of special cases

      //! if input auto is empty then a random value will be generated
      else if (inputValue === '') {
        allInputs[i].value = Math.floor(Math.random() * 5) + 1
      }
      else {
        allInputs[i].value = inputValue
      }
    }
  }

  try {
    document.getElementById('a_next').click()
  }
  catch {

  }

  //* related functions to convert dates
  function formatDate(date) {
    // Format: YYYY-MM-DD
    return date.toISOString().split('T')[0];
  }

  function formatMonth(date) {
    // Format: YYYY-MM
    return date.toISOString().split('T')[0].slice(0, 7);
  }
  // Format date to YYYY-MM-DD
  function formatDateTime(date) {
    // Format: YYYY-MM-DDTHH:MM (e.g., 2024-03-27T12:00)
    return date.toISOString().slice(0, 16);
  }
  // Format date to YYYY-Www
  function formatWeek(date) {
    // Format: YYYY-Www (e.g., 2024-W13)
    const year = date.getFullYear();
    const weekNumber = getISOWeek(date); // Assuming you have a function to get ISO week number
    return `${year}-W${weekNumber}`;
  }

  // Function to get the ISO week number
  function getISOWeek(date) {
    const weekStart = new Date(date.getFullYear(), 0, 1);
    const diff = date - weekStart;
    const oneWeek = 604800000; // milliseconds in a week
    return Math.ceil((diff + ((weekStart.getDay() + 1) * 86400000)) / oneWeek);
  }

  // Format date to HH:MM
  function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function randomColor() {
    let n = (Math.random() * 0xfffff * 1000000).toString(16);
    return '#' + n.slice(0, 6);
  }
}
