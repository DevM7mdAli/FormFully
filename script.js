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
      //! if input auto is empty then a random value will be generated
      if (inputValue === '') {
        allInputs[i].value = Math.floor(Math.random() * 5) + 1
      } else {
        allInputs[i].value = inputValue
      }
    }
  }

  try {
    document.getElementById('a_next').click()
  }
  catch {

  }
}
