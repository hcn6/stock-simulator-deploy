import React, { useEffect, useState } from 'react';
import { useTheme } from '@material-ui/core/styles';
import { LineChart, Line, XAxis, YAxis, Label, ResponsiveContainer, Tooltip } from 'recharts';
import Title from './Title';
import axios from 'axios';
import { create } from 'lodash';

// Generate Sales Data
function createData(time, amount) {
  return { time, amount };
}

export default function Chart(props) {
  const theme = useTheme();
  const [chartData, setChartData] = useState([]);


  useEffect(() => {
    const data = async () => {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}allInvesting`);
      const list = response.data.reduce((result, row) => {
        const obj = createData(row["time"], row["amount"]);
        result.push(obj);
        return result;
      }, []);
      setChartData(list);
    }
    data();
  }, [])

  useEffect(() => {
    
    if (props.chartData !== undefined) {
      
      setChartData(chartData => {
        const receive = props.chartData;
        const data = createData(receive["time"], receive["amount"]);
        chartData.push(data);
        return chartData
      })
      console.log(chartData.length);
    }
  }, [props.chartData])
  return (
    <React.Fragment>
      <Title align="center">Today</Title>
      <ResponsiveContainer >
        <LineChart
          data={chartData.slice()}
          margin={{
            top: 16,
            right: 0,
            bottom: 0,
            left: 0,
          }}
        >
          <XAxis padding={{ left: 0 }} dataKey="time" stroke={theme.palette.text.secondary} />
          <YAxis padding={{ left: 0 }} hide={true} stroke={theme.palette.text.secondary} domain={['dataMin', 'dataMax']}>
            <Label
              angle={270}
              position="left"
              style={{ textAnchor: 'middle', fill: theme.palette.text.primary }}
            >
              Investing ($)
            </Label>
          </YAxis>
          <Tooltip></Tooltip>
          <Line type="monotone" dataKey="amount" stroke={theme.palette.primary.main} stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </React.Fragment>
  );
}