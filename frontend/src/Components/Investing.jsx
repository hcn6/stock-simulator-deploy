import { Typography } from '@material-ui/core';
import React, { useContext, useEffect, useState } from 'react';
import { TransactionContext, StockPriceContext, DepositContext } from './Layout'
import { withStyles, makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Title from './Title';
import axios from 'axios';
const useStyles = makeStyles(theme => ({
    direction: {
        display: "flex",
        flexDirection: "row",
        alignContent: "space-between",
        '& > div:not(:first-child)': {
            marginLeft: theme.spacing(8)
        },
        margin: theme.spacing(5)
    },
    depositContext: {
        flex: 1,
    },
}));
const Investing = (props) => {
    const transactions = useContext(TransactionContext).transaction;
    const updatedPrice = useContext(StockPriceContext).currentPrice;
    const buyPower = useContext(DepositContext).buyPower
    const deposit = useContext(DepositContext).deposit
    const totalReturn = () => {
        return Object.keys(transactions).reduce((result, row) => {
            let currentRowPrice = (updatedPrice[row])
            let shares = '0';
            let equity = '0';
            let totalReturn = '0';
            shares = (parseFloat(transactions[row]["shares"]).toLocaleString('en-US', { maximumFractionDigits: 7 }));
            if (shares !== undefined && currentRowPrice !== undefined) {
                equity = `$ ${(parseFloat(shares.replace(',', '')).toFixed(6) * parseFloat(currentRowPrice.replace(',', ''))).toLocaleString()}`;
            }
            totalReturn = parseFloat(parseFloat(equity.replace('$', '').replace(',', '')) - parseFloat(transactions[row]["total"])).toFixed(3)
            result += parseFloat(totalReturn);
            return result;
        }, 0)
    }
    const totalStockInitial = () => {
        return Object.keys(transactions).reduce((result, row) => {
            result += parseFloat(transactions[row]["total"])
            return result;
        }, 0)
    }
    const classes = useStyles();

    const getRandomInt = (max) => {
        return Math.floor(Math.random() * Math.floor(max));
    }
    useEffect(() => {
        localStorage.setItem("investing", (buyPower + totalStockInitial() + totalReturn()).toFixed(3))
    }, [updatedPrice])

    useEffect(() => {
        
        const postData = async () => {
            const currentDay = new Date();
            const [date, time] = currentDay.toLocaleString('en-US', { timeZone: 'America/New_York' }).split(', ')
            const data = {
                "amount": localStorage.getItem("investing"),
                "date": date,
                "time": time
            }
            
            props.modifyChartData(data)
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}addInvesting`, data)
        }
        // console.log(`Day ${day.getDay()}`)
        // console.log(`Hour ${day.getHours()}`)
        const outerDay = new Date();
        if (outerDay.getDay() !== 0 && outerDay.getDay() !== 6 && outerDay.getHours() <= 17) {
            // console.log(day.getHours())
            const interval = setInterval(() => {
                postData()
            }, 60000)
            return () => clearInterval(interval);
        }

    }, [])

    return (
        <React.Fragment>
            <Grid className={classes.direction}>
                <Grid>
                    <Title>Investing</Title>
                    <Typography component="p" variant="h4">
                        ${(buyPower + totalStockInitial() + totalReturn()).toFixed(3)}
                    </Typography>
                </Grid>
                <Grid>
                    <Title>Profit</Title>
                    <Typography component="p" variant="h4">
                        ${(buyPower + totalStockInitial() + totalReturn() - deposit).toFixed(3)}
                    </Typography>
                </Grid>
                <Grid>
                    <Title>Buying Power</Title>
                    <Typography component="p" variant="h4">
                        ${buyPower.toFixed(3)}
                    </Typography>
                </Grid>
            </Grid>
        </React.Fragment>
    )
}
export default Investing;