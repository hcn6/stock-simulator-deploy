import React, { useState, useEffect, useContext } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import Alert from '@material-ui/lab/Alert';
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


const BuyInputForm = (props) => {
    const classes = useStyles();
    const [stockName, setStockName] = useState('');
    const [shares, setShares] = useState('');
    const [price, setPrice] = useState('');
    const [enoughMoney, setEnoughMoney] = useState(true)
    const modify = useContext(TransactionContext).handleModifyingStock;
    const newHistory = useContext(TransactionContext).handleModifyingHistory;
    const handleStockNameChange = e => setStockName(e.target.value);
    const handleSharesChange = e => setShares(e.target.value);
    const handlePriceChange = e => setPrice(e.target.value);
    const buyPower = useContext(DepositContext).buyPower;
    const newBuyPower = useContext(DepositContext).handleBuyAndSell;
    const updatedPrice = useContext(StockPriceContext).currentPrice;

    const handleSubmit = async e => {
        e.preventDefault()
        e.stopPropagation()
        const API_KEY = process.env.REACT_APP_API_KEY;
        const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${stockName.toUpperCase()}&token=${API_KEY}`);
        const cPrice = (response.data)["c"].toString();
        if (parseFloat(shares) * parseFloat(cPrice) > buyPower) {
            setEnoughMoney(false);
        }
        else {
            const data = {
                "Stock Name": stockName.toUpperCase(),
                "Shares": shares,
                "Price": cPrice,
                "Total": parseFloat(shares) * parseFloat(cPrice)
            };

            const history = {
                "stock": stockName.toUpperCase(),
                "shares": shares,
                "price": cPrice,
                "total": parseFloat(shares) * parseFloat(cPrice),
                "date": new Date().toLocaleDateString()
            }
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}addTransaction`, data)
                .then((res) => {
                    setStockName('');
                    setPrice('');
                    setShares('');
                    console.log(res.data.data)
                    res.data.data["Price"] = parseFloat(res.data.data["Price"]).toFixed(3).toString();
                    res.data.data["Shares"] = parseFloat(res.data.data["Shares"]).toFixed(3).toString();
                    modify(res.data.data, true)
                });
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}tradeHistory`, history);
            
            await newHistory(history);
            await newBuyPower({
                "amount": parseFloat(buyPower) - (parseFloat(shares) * parseFloat(cPrice)),
                "date": Date.now()
            });
        }
    }
    useEffect(() => {
        if (parseFloat(shares) * parseFloat(updatedPrice[stockName]) > buyPower) {
            setEnoughMoney(false);
        }
        else {
            setEnoughMoney(true);
        }
    }, [shares])
    return (
        <React.Fragment>
            <form className={classes.root} noValidate autoComplete="off" onSubmit={handleSubmit}>
                <FormControl>
                    <InputLabel> Stock Name</InputLabel>
                    <Input id="outlined-basic" onChange={handleStockNameChange} value={stockName} />
                </FormControl>
                <FormControl>
                    <InputLabel> Shares</InputLabel>
                    <Input id="outlined-basic" onChange={handleSharesChange} value={shares} />
                </FormControl>
                <Button type='submit' variant="contained" color="primary" error={!enoughMoney}>
                    Submit
                </Button>
            </form>
            {!enoughMoney && <Alert severity="error">Buying Power is not enough</Alert>}
        </React.Fragment>

    );
}
export default BuyInputForm