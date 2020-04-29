// Add whitespace to the front of a string until it's at least numCharacters long
function padString(s, numCharacters) {
  let result = s;
  while (result.length < numCharacters) {
    result = ` ${result}`;
  }
  return result;
}

module.exports = {
  padString,
};
