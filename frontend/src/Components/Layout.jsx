import { useState, useEffect, useRef } from 'react';
import React from 'react';
import Grid from '@material-ui/core/Grid';
import StockDisplay from './StockDisplay';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import BuyInputForm from './BuyInputForm';
import SellInputForm from './SellInputForm';
import DepositForm from './DepositForm';
import WithdrawalForm from './WithdrawalForm';
import axios from 'axios';
import { Typography } from '@material-ui/core';
import { Paper } from '@material-ui/core';
import Investing from './Investing';
import Chart from './Chart';
const useStyles = makeStyles(theme => ({
    container: {
        display: "flex"
    },
    table: {
        minWidth: 700,
    },
    tableRightBorder: {
        borderWidth: 1,
        borderColor: 'black',
        borderStyle: 'solid'
    },
    stockDisplay: {
        width: 600,
        marginRight: 30,
    },
    lineDisplay: {
        marginBottom: 100,
    },
    inputAndTable: {
        display: "flex",
        justifyContent: 'center',
        marginTop: 50,
        flexDirection: "row"
    },
    investing: {
        display: 'flex',
        justifyContent: 'center',
    },
    paperColor: {
        backgroundColor: "#424242"
    },
    deposit: {
        display: "flex",
        flexDirection: "row",
        marginTop: theme.spacing(4)
    },
    depositMargin: {
        marginRight: theme.spacing(2)
    },
    chartGrid: {
        width: "100%",
        height: "400px"
    }
}));

export const TransactionContext = React.createContext();
export const StockPriceContext = React.createContext();
export const DepositContext = React.createContext();

const useIsMount = () => {
    const isMountRef = useRef(true);
    useEffect(() => {
        isMountRef.current = false;
    }, []);
    return isMountRef.current;
};
const Layout = () => {
    const classes = useStyles();
    const [transaction, setTransaction] = useState({});
    const [currentPrice, setCurrentPrice] = useState({});
    const [deposit, setDeposit] = useState(0);
    const [buyPower, setBuyPower] = useState(0);
    const [history, setHistory] = useState({});
    const prevDeposit = useRef();
    function createTransaction(shares, price, total, current) {
        return { shares, price, total, current };
    }
    const handleModifyingStock = (data) => {
        setTransaction(transaction => {
            if (data["Shares"] === 0) {
                delete transaction[data["Stock Name"]];
                return { ...transaction }
            }
            return { ...transaction, [data["Stock Name"]]: createTransaction(data["Shares"], data["Price"], data["Total"], 0) }
        })

        setCurrentPrice(currentPrice => {
            return { ...currentPrice, [data["Stock Name"]]: data["Price"] }
        })
    }

    async function handleDepositChange(data) {
        const sendDeposit = async () => {
            const sendData = {
                "amount": parseFloat(deposit) + parseFloat(data["amount"]),
                "date": Date.now(),
            }
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}addDeposit`, sendData)
        }
        await sendDeposit();
        setDeposit(deposit => {
            return parseFloat(deposit) + parseFloat(data["amount"])
        })
    }

    async function handleBuyPowerChange(data) {
        const sendBuyPower = async () => {
            const sendData = {
                "amount": parseFloat(buyPower) + parseFloat(data["amount"]),
                "date": Date.now(),
            }
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}buyPower`, sendData);
        }
        await sendBuyPower();
        setBuyPower(parseFloat(buyPower) + parseFloat(data["amount"]));
    }

    async function handleBuyAndSell(data) {
        const sendBuyPower = async () => {
            const sendData = {
                "amount": parseFloat(data["amount"]),
                "date": Date.now(),
            }
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}buyPower`, sendData)
        }
        await sendBuyPower();
        setBuyPower(data["amount"])
    }

    async function handleModifyingHistory(data) {
        setHistory(history => {
            const stock = data['stock'];
            if (history[stock] !== undefined) {
                history[stock].push(data);
            }
            else {
                const hist = []
                hist.push(data)
                history = {...history, [stock]: hist}
            }
            return history;
        })
    }

    const [chartData, setChartData] = useState({});
    const handleModifyingChartData = async (data) => {
        setChartData(data);
    }
    useEffect(() => {
        const fetchData = async () => {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}allTransactions`)
            if (Object.keys(response.data).length !== 0) {
                let stockMap = {}
                response.data.forEach((stock, i) => {
                    const names = stock["Stock Name"]
                    stockMap = { ...stockMap, [names]: createTransaction(stock["Shares"], stock["Price"], stock["Total"], 0) }
                })
                setTransaction(stockMap);
            }
            else {
                setTransaction({})
            }
        }
        const fetchData2 = async () => {
            let day = new Date();
            const backend = await axios.get(`${process.env.REACT_APP_BACKEND_URL}allStockPrice`)
            console.log(backend)
            
            if (day.getDay() !== 0 && day.getDay() !== 6 && !day.getHours() <= 3 && !day.getHours >= 21) {
                setCurrentPrice(backend.data);
            }
            else {
                let stockName = Object.keys(backend.data);
                const API_KEY = process.env.REACT_APP_API_KEY;
                for (let i = 0; i < stockName.length; i++) {
                    const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${stockName[i].toUpperCase()}&token=${API_KEY}`);
                    const price = response.data["c"].toString()
                    setCurrentPrice(currentPrice => {
                        return { ...currentPrice, [stockName[i]]: price }
                    })
                }
            }
        }
        fetchData();
        fetchData2();
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}mostRecentDeposit`)
            if (response.data.length !== 0) {
                setDeposit(response.data[0].amount);
            }
        }
        fetchData()
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}mostRecentBuyPower`)
            if (response.data.length !== 0) {
                setBuyPower(response.data[0].amount);
            }
        }
        fetchData()
    }, [])

    useEffect(() => {
        // const socket = io.connect("http://localhost:8080");
        // socket.on("change-type", async (data) => {
        //     const [key, value] = Object.entries(data)[0]
        //     setCurrentPrice((currentPrice) => {
        //         return { ...currentPrice, [key]: value }
        //     })
        // })
        const API_KEY = process.env.REACT_APP_API_KEY;
        const socket2 = new WebSocket(`wss://ws.finnhub.io?token=${API_KEY}`);

        // Connection opened -> Subscribe
        socket2.addEventListener('open', function (event) {
            const list = Object.keys(transaction)
            for (var i = 0; i < list.length; i++) {
                socket2.send(JSON.stringify({ 'type': 'subscribe', 'symbol': list[i] }))
            }
        });

        // Listen for messages
        socket2.addEventListener('message', function (event) {
            const data = JSON.parse(event.data).data
            if (data !== undefined) {
                setCurrentPrice(currentPrice => {
                    const price = data[0]["p"].toString()
                    const name = data[0]["s"]
                    return { ...currentPrice, [name]: price }
                })
            }
        });
    }, [transaction])

    useEffect(() => {
        const sendDeposit = async () => {
            const data = {
                "amount": deposit,
                "date": Date.now(),
            }
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}deposit`, data)
        }
        if (deposit === 0 && localStorage.getItem(deposit) === 0) {
            sendDeposit();
        }
    }, [deposit])

    useEffect(() => {
        localStorage.setItem("deposit", deposit);
    }, [prevDeposit.current])

    useEffect(() => {
        const fetchData = async () => {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}allTradeHistory`);
            if (Object.keys(response.data.data).length !== 0) {
                setHistory(response.data.data);
            }
        }
        fetchData();
    }, [])

    
    return (
        <React.Fragment>
            <Grid className={classes.container} alignItems="center" container>
                <StockPriceContext.Provider value={{ currentPrice }}>
                    <TransactionContext.Provider value={{ transaction, history, handleModifyingStock, handleModifyingHistory }}>
                        <DepositContext.Provider value={{ deposit, buyPower, handleDepositChange, handleBuyAndSell, handleBuyPowerChange }}>
                            <Grid className={classes.investing} alignItems="center" container>
                                <Investing modifyChartData={handleModifyingChartData}>
                                </Investing>
                            </Grid>
                            <Grid className={classes.chartGrid}>
                                <Chart chartData = {chartData}>

                                </Chart>
                            </Grid>
                            <Grid className={classes.inputAndTable}>
                                <Grid className={classes.stockDisplay} >
                                    <StockDisplay >
                                    </StockDisplay>
                                </Grid>
                                <Grid>
                                    <Typography variant="h4" align="left" color="primary">
                                        Buy Stock
                                    </Typography>
                                    <BuyInputForm >
                                    </BuyInputForm>
                                    <Typography variant="h4" align="left" color="primary">
                                        Sell Stock
                                    </Typography>
                                    <SellInputForm >
                                    </SellInputForm>
                                    <div className={classes.deposit}>
                                        <div className={classes.depositMargin}>
                                            <Typography variant="h4" align="left" color="primary">
                                                Deposit
                                                </Typography>
                                            <DepositForm >
                                            </DepositForm>
                                        </div>
                                        <div>
                                            <Typography variant="h4" align="left" color="primary">
                                                Withdraw
                                                </Typography>
                                            <WithdrawalForm>
                                            </WithdrawalForm>
                                        </div>
                                    </div>
                                </Grid>
                            </Grid>
                        </DepositContext.Provider>
                    </TransactionContext.Provider>
                </StockPriceContext.Provider>
            </Grid>
        </React.Fragment >
    );
}
export default Layout;