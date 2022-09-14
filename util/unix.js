function unix(day) {
  const currentDay = new Date().getDate() + day;
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const date = new Date(currentYear, currentMonth, currentDay);
  var unixTimeStamp = Math.floor(date.getTime() / 1000);
  return unixTimeStamp;
}

module.exports = unix;
