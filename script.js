document.addEventListener('DOMContentLoaded', function () {


  document.getElementById("auto").addEventListener("input", function () {
    console.log(this.value)
    if (!localStorage.getItem("defaultValue")) {
      localStorage.setItem("defaultValue", "")
    }
      localStorage.setItem("defaultValue", this.value)
    document.getElementById("auto").value = localStorage.getItem("defaultValue")
  })
  document.getElementById("auto").value = localStorage.getItem("defaultValue")

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
  console.log(document.getElementsByTagName('input'))
  const allInputs = document.getElementsByTagName('input')
  for (let i = 0; i < allInputs.length; i++) {

    if (allInputs[i].id.match(/^c/)) {
      allInputs[i].value = inputValue
    }
  }

  document.getElementById('a_next').click()
}
