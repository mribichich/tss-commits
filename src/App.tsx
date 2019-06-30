import { DatePicker } from 'antd';
import 'antd/dist/antd.css';
import { RangePickerValue } from 'antd/lib/date-picker/interface';
import moment from 'moment';
import { groupBy, head, isEmpty, last, length, not, sortBy, sum, range } from 'ramda';
import React from 'react';
import {
  Hint,
  HorizontalGridLines,
  LineSeries,
  VerticalBarSeries,
  VerticalGridLines,
  XAxis,
  XYPlot,
  YAxis,
} from 'react-vis';
import 'react-vis/dist/style.css';
import { Commit, getCommits } from './api';
import styled from 'styled-components';

const { RangePicker } = DatePicker;

const Root = styled.div`
  margin: 20px;
`;

type Point = {
  x: number;
  y: number;
};

type GroupCommits = {
  [index: string]: Commit[];
};

type State = {
  commits: GroupCommits;
  value;
  dates: RangePickerValue;
};

// const App: React.FC = () => {
class App extends React.Component<{}, State> {
  state: Readonly<State> = {
    commits: {},
    value: null,
    dates: [],
  };

  allCommits: Commit[] = [];
  commitsByAuthor: Commit[] = [];

  async getProjectCommits(project: string) {
    return await getCommits(project, {
      all: true,
      with_stats: true,
      per_page: 100,
    });
  }

  async componentDidMount() {
    for (const project of [
      'sis/sis-presentismo-web',
      'sis/sis-presentismo-api',
      'sis/sis-presentismo-service',
      'sis/sis-access-data',
    ]) {
      const commits = await this.getProjectCommits(project);

      this.allCommits = [...this.allCommits, ...commits];
    }

    this.commitsByAuthor = sortBy(
      s => s.committed_date,
      this.allCommits.filter(f => f.author_name === 'Adrian Tavella')
    );

    // const firstCommit = commitsByAuthor[0].committed_date;
    // const lastCommit = last(commitsByAuthor).committed_date;

    this.filterCommits();
  }

  filterCommits(dates?: RangePickerValue) {
    const initialCommits = (() => {
      if (!dates) {
        return this.commitsByAuthor;
      }

      const [start, end] = dates;

      if (start && !end) {
        return this.commitsByAuthor.filter(f => moment(f.committed_date).isSameOrAfter(start));
      }

      if (!start && end) {
        return this.commitsByAuthor.filter(f => moment(f.committed_date).isSameOrBefore(end));
      }

      return this.commitsByAuthor.filter(f => moment(f.committed_date).isBetween(start, end));
    })();

    const commitsGroupPerDay = groupBy(g => moment(g.committed_date).format('YYYY/MM/DD'), initialCommits);

    const [start = undefined, end = undefined] = dates || [];

    const firstDate = !dates || !start ? moment(initialCommits[0].committed_date).startOf('d') : start;
    const lastDate = !dates || !end ? moment(last(initialCommits).committed_date).startOf('d') : end;

    const diffDays =
      moment(lastDate)
        .startOf('d')
        .diff(moment(firstDate).startOf('d'), 'days') + 1;

    const commits = range(0, diffDays).reduce<GroupCommits>((acc, cur) => {
      const date = moment(firstDate).add(cur, 'd');
      const dateFormated = date.format('YYYY/MM/DD');
      const group = commitsGroupPerDay[dateFormated];

      return { ...acc, [dateFormated]: group || [] };
    }, {});

    this.setState({
      commits: commits,
      // ranges: calculateRanges(firstCommit, lastCommit)
    });
  }

  _rememberValue = value => {
    this.setState({ value });
  };

  handleDateRangeChange = (dates: RangePickerValue, dateStrings: [string, string]) => {
    this.setState({
      dates,
    });

    this.filterCommits(dates);
  };

  render() {
    const commitsPerDayData = Object.keys(this.state.commits).map(keyDate => ({
      x: moment(keyDate)
        .toDate()
        .getTime(),
      y: length(this.state.commits[keyDate]),
    }));

    const {
      dates: [startTmp, endTmp],
    } = this.state;

    const start = not(isEmpty(commitsPerDayData))
      ? (startTmp && startTmp.toDate().getTime()) || head(commitsPerDayData).x
      : undefined;
    const end = not(isEmpty(commitsPerDayData))
      ? (endTmp && endTmp.toDate().getTime()) || last(commitsPerDayData).x
      : undefined;

    return (
      <Root>
        <div>
          <RangePicker onChange={this.handleDateRangeChange} />
        </div>

        <br />
        <br />

        <div>
          <strong>Commits</strong>
          <br />
          <XYPlot margin={{ left: 100, bottom: 100 }} width={1100} height={200} xType="time" xDomain={[start, end]}>
            <HorizontalGridLines />
            <VerticalGridLines />
            <XAxis tickFormat={v => moment(v).format('ddd DD/MM')} tickLabelAngle={-90} />
            <YAxis />

            <LineSeries data={commitsPerDayData} />
          </XYPlot>
        </div>

        <br />
        <br />

        {this.renderPlot()}
      </Root>
    );
  }

  renderPlot() {
    const commitsPerDayData = Object.keys(this.state.commits).map(keyDate => ({
      x: moment(keyDate)
        .toDate()
        .getTime(),
      y: sum(this.state.commits[keyDate].map(m2 => m2.stats.additions)),
    }));

    // const additions = commits.map(m => ({
    //   x: m.committed_date.getTime(),
    //   y: m.stats.additions
    // }));
    // const deletions = commits.map(m => ({
    //   x: m.committed_date.getTime(),
    //   y: m.stats.deletions
    // }));

    const {
      value,
      dates: [startTmp, endTmp],
    } = this.state;

    const start = not(isEmpty(commitsPerDayData))
      ? (startTmp && startTmp.toDate().getTime()) || head(commitsPerDayData).x
      : undefined;
    const end = not(isEmpty(commitsPerDayData))
      ? (endTmp && endTmp.toDate().getTime()) || last(commitsPerDayData).x
      : undefined;

    // const maxY = last(
    //   sortBy(s => s, flatten<number>(commits.map(m => [m.stats.additions])))
    // );

    return (
      <div>
        <strong>Lines editadas</strong>
        <br />

        {not(isEmpty(commitsPerDayData)) ? (
          <XYPlot
            margin={{ left: 100, bottom: 100 }}
            width={1100}
            height={300}
            stackBy="y"
            xType="time"
            xDomain={[start, end]}
            // yDomain={[0, maxY < 500 ? maxY : 500]}
          >
            <VerticalGridLines />
            <HorizontalGridLines />
            <XAxis tickFormat={v => moment(v).format('ddd DD/MM')} tickLabelAngle={-90} />
            <YAxis />
            <VerticalBarSeries data={commitsPerDayData} color={'green'} onNearestX={this._rememberValue} />
            {/* <VerticalBarSeries
              data={deletions}
              color={"red"}
              onNearestX={this._rememberValue}
            /> */}

            {value ? (
              <Hint
                value={value}
                align={{
                  horizontal: Hint.ALIGN.AUTO,
                  vertical: Hint.ALIGN.TOP_EDGE,
                }}
              >
                <div className="rv-hint__content">{value.y}</div>
              </Hint>
            ) : null}
          </XYPlot>
        ) : (
          'no data'
        )}
      </div>
    );
  }
}

export default App;
