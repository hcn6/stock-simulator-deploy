import React, { useState, useEffect, useContext } from 'react';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { TransactionContext, StockPriceContext } from './Layout';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import Collapse from '@material-ui/core/Collapse';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import axios from 'axios';
const StyledTableCell = withStyles((theme) => ({
    head: {
        backgroundColor: theme.palette.primary.light,
        color: theme.palette.common.black,
        borderWidth: 1,
        borderColor: 'black',
        borderStyle: 'solid',
    },
    body: {
        fontSize: 14,
    },
}))(TableCell);

const StyledTableRow = withStyles((theme) => ({
    root: {
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.action.hover,
        },
    },
}))(TableRow);



function createTransaction(shares, price, total, current) {
    return { shares, price, total, current };
}

const useStyles = makeStyles({
    table: {
        minWidth: "50%"
    },
    tableRightBorder: {
        borderWidth: 1,
        borderColor: 'black',
        borderStyle: 'solid',
    },
});
const useRowStyles = makeStyles({
    root: {
        '& > *': {
            borderBottom: 'unset',
        },
    },
    tableRightBorder: {
        borderWidth: 1,
        borderColor: 'black',
        borderStyle: 'solid',
    },
});
const Row = (props) => {
    const { row } = props;
    const [open, setOpen] = React.useState(false);
    const classes = useRowStyles();

    return (
        <React.Fragment>
            <TableRow className={classes.root}>
                <TableCell className={classes.tableRightBorder}>
                    <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell className={classes.tableRightBorder} align="center" component="th" scope="row">
                    {row.name}
                </TableCell>
                <TableCell className={classes.tableRightBorder} align="center">{row.shares}</TableCell>
                <TableCell className={classes.tableRightBorder} align="center">{row.equity}</TableCell>
                <TableCell className={classes.tableRightBorder} align="center">{row.totalReturn}</TableCell>
                <TableCell className={classes.tableRightBorder} align="center">{row.currentRowPrice}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box margin={1}>
                            <Typography variant="h6" gutterBottom component="div">
                                History
                            </Typography>
                            <Table size="small" aria-label="purchases">
                                <TableHead>
                                    <TableRow>
                                        <TableCell className={classes.tableRightBorder} align="center">Date</TableCell>
                                        <TableCell className={classes.tableRightBorder} align="center">Shares</TableCell>
                                        <TableCell className={classes.tableRightBorder} align="center">Price</TableCell>
                                        <TableCell className={classes.tableRightBorder} align="center">Total</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {
                                        !!props.history ? (props.history).map((stock) => {
                                            return <TableRow key={stock["_id"]}>
                                                <TableCell className={classes.tableRightBorder} align="center" component="th" scope="row">
                                                    {stock["date"]}
                                                </TableCell>
                                                <TableCell className={classes.tableRightBorder} align="center">{stock["shares"]}</TableCell>
                                                <TableCell className={classes.tableRightBorder} align="center">{stock["price"]}</TableCell>
                                                <TableCell className={classes.tableRightBorder} align="center">
                                                    {stock["total"]}
                                                </TableCell>
                                            </TableRow>
                                        }
                                        ) : null
                                    }

                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}

Row.propTypes = {
    row: PropTypes.shape({
        name: PropTypes.string.isRequired,
        shares: PropTypes.number.isRequired,
        equity: PropTypes.number,

        history: PropTypes.arrayOf(
            PropTypes.shape({
                total: PropTypes.number,
                shares: PropTypes.string,
                date: PropTypes.string,
            }),
        ),
        totalReturn: PropTypes.number,
        currentPrice: PropTypes.number,
    }),
};
const StockDisplay = (props) => {
    const classes = useStyles();
    const transactions = useContext(TransactionContext).transaction;
    const updatedPrice = useContext(StockPriceContext).currentPrice;
    const history = useContext(TransactionContext).history;

    return (
        <TableContainer border={1} component={Paper}>
            <Table aria-label="collapsible table">
                <TableHead>
                    <TableRow>
                        <StyledTableCell className={classes.tableRightBorder} align="center"></StyledTableCell>
                        <StyledTableCell className={classes.tableRightBorder} align="center">Stock Name</StyledTableCell>
                        <StyledTableCell className={classes.tableRightBorder} align="center">Shares</StyledTableCell>
                        <StyledTableCell className={classes.tableRightBorder} align="center">Equity</StyledTableCell>
                        <StyledTableCell className={classes.tableRightBorder} align="center">Total Return</StyledTableCell>
                        <StyledTableCell className={classes.tableRightBorder} align="center">Current Price</StyledTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Object.keys(transactions).reduce((result, row) => {
                        let currentRowPrice = updatedPrice[row] === undefined ? '0' : updatedPrice[row].toString()
                        let shares = '0';
                        let equity = '0';
                        let totalReturn = '0'
                        shares = (parseFloat(transactions[row]["shares"]).toLocaleString('en-US', { maximumFractionDigits: 7 }));
                        if (shares !== undefined && currentRowPrice !== undefined) {
                            equity = `$ ${(parseFloat(shares.replace(',', '')).toFixed(6) * parseFloat(currentRowPrice.replace(',', ''))).toLocaleString()}`;
                        }
                        totalReturn = parseFloat(parseFloat(equity.replace('$', '').replace(',', '')) - parseFloat(transactions[row]["total"])).toFixed(3)
                        let data = {
                            name: row,
                            shares: shares,
                            equity: equity,
                            totalReturn: totalReturn,
                            currentRowPrice: currentRowPrice,
                            history: []
                        }
                        result.push(
                            <Row className={classes.tableRightBorder} key={data.name} row={data} history={history[row]}>

                            </Row>
                        )
                        // result.push(<StyledTableRow>
                        //     <StyledTableCell className={classes.tableRightBorder} component="th" scope="row" align="center">
                        //         {row}
                        //     </StyledTableCell>
                        //     <StyledTableCell className={classes.tableRightBorder} align="center">{shares}</StyledTableCell>
                        //     <StyledTableCell className={classes.tableRightBorder} align="center">{equity}</StyledTableCell>
                        //     <StyledTableCell className={classes.tableRightBorder} align="center">{totalReturn}</StyledTableCell>
                        //     <StyledTableCell className={classes.tableRightBorder} align="center">{currentRowPrice}</StyledTableCell>
                        // </StyledTableRow>)
                        return result
                    }, [])}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
export default StockDisplay;