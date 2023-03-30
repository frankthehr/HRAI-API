// Function that loops through an object and returns true is any of the values are truthy or false if all are falsy
function hasTruthyValue(obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key) && obj[key]) {
      return true;
    }
  }
  return false;
}

export { hasTruthyValue }