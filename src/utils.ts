import moment from "moment";

export function calculateStartOfMonth(date: Date | moment.Moment) {
  return moment(date).startOf("month");
}

export function calculateStartOfByBiweekly(date: Date | moment.Moment) {
  return moment(date)
    .date(15)
    .startOf("day");
}

export function calculateEndOfMonth(date: Date | moment.Moment) {
  return moment(date).endOf("month");
}

export function calculateEndOfByBiweekly(date: Date | moment.Moment) {
  return moment(date)
    .date(14)
    .endOf("day");
}

export function calculateRanges(firstCommit: Date, lastCommit: Date) {
  let ranges = [];

  const firstDate =
    firstCommit.getDate() < 15
      ? calculateStartOfMonth(firstCommit)
      : calculateStartOfByBiweekly(firstCommit);
  const lastDate =
    lastCommit.getDate() < 15
      ? calculateEndOfByBiweekly(lastCommit)
      : calculateEndOfMonth(lastCommit);

  let start = moment(firstDate);

  while (start.isBefore(lastDate)) {
    if (start.date() === 1) {
      ranges.push({
        start: moment(start),
        end: calculateEndOfByBiweekly(start)
      });

      start = calculateStartOfByBiweekly(start);

      continue;
    }

    ranges.push({ start: moment(start), end: calculateEndOfMonth(start) });

    start = calculateStartOfMonth(start.add(1, "month"));
  }

  return ranges;
}
