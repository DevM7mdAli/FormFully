document.addEventListener('click', function (e) {
  if (e.target && e.target.id == 'fillButton') {
    const valueToFill = document.getElementById("auto")
    console.log("hello")
    let fill = document.getElementsByTagName('input')
    fill[0].value = Number(valueToFill.value)
    console.log(window.document.getElementsByTagName('input'))
  }
})