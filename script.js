document.addEventListener('DOMContentLoaded', function () {
  document.getElementById("auto").value = localStorage.getItem("defaultValue")


  document.getElementById("auto").addEventListener("input", function () {
      localStorage.setItem("defaultValue", this.value)
  })

  document.getElementById('fillButton').addEventListener('click', function () {
    const inputValue = document.getElementById('auto').value;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var activeTab = tabs[0];
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: fillFields,
        args: [inputValue]
      });
    });
  });
});

function fillFields(inputValue) {
  const allInputs = document.getElementsByTagName('input')
  for (let i = 0; i < allInputs.length; i++) {

    if (allInputs[i].id.match(/^c/)) {
      allInputs[i].value = inputValue
    }
  }

  document.getElementById('a_next').click()
}
