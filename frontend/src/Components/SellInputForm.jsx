import React, { useState, useContext } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import axios from 'axios';
import { TransactionContext, StockPriceContext, DepositContext } from './Layout'

const useStyles = makeStyles((theme) => ({
    root: {
        '& > *': {
            margin: theme.spacing(1),
            width: '25ch',
        },
    },
}));


const SellInputForm = (props) => {
    const classes = useStyles();
    const [stockName, setStockName] = useState('');
    const [shares, setShares] = useState('');
    const [price, setPrice] = useState('');
    const handleStockNameChange = e => setStockName(e.target.value);
    const handleSharesChange = e => setShares(e.target.value);
    const handlePriceChange = e => setPrice(e.target.value);
    const modify = useContext(TransactionContext).handleModifyingStock;
    const newHistory = useContext(TransactionContext).handleModifyingHistory;
    const buyPower = useContext(DepositContext).buyPower;
    const newBuyPower = useContext(DepositContext).handleBuyAndSell;
    const updatedPrice = useContext(StockPriceContext).currentPrice;
    const handleSubmit = async e => {
        e.preventDefault()
        const data = {
            "Stock Name": stockName,
            "Shares": shares,
            "Price": updatedPrice[stockName],
            "Total": parseFloat(shares) * parseFloat(updatedPrice[stockName])
        };
        const history = {
            "stock": stockName.toUpperCase(),
            "shares": shares,
            "price": updatedPrice[stockName],
            "total": -(parseFloat(shares) * parseFloat(updatedPrice[stockName])),
            "date": new Date().toLocaleDateString()
        }
        axios.post(`${process.env.REACT_APP_BACKEND_URL}sellTransaction`, data)
            .then((res) => {
                setStockName('');
                setPrice('');
                setShares('');
                modify(res.data.data)
            });
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}tradeHistory`, history);

        await newHistory(history);
        newBuyPower({
            "amount": parseFloat(buyPower) + (parseFloat(shares) * parseFloat(updatedPrice[stockName])),
            "date": Date.now()
        })
    }
    return (
        <form className={classes.root} noValidate autoComplete="off" onSubmit={handleSubmit}>
            <FormControl>
                <InputLabel> Stock Name</InputLabel>
                <Input id="outlined-basic" onChange={handleStockNameChange} value={stockName} />
            </FormControl>
            <FormControl>
                <InputLabel> Shares</InputLabel>
                <Input id="outlined-basic" onChange={handleSharesChange} value={shares} />
            </FormControl>
            <Button type='submit' variant="contained" color="primary" onSubmit={handleSubmit}>
                Submit
            </Button>
        </form>
    );
}
export default SellInputForm