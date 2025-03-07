// @ts-nocheck
import React, { Fragment, useCallback, useEffect, useState } from "react";
import createStyles from "@mui/styles/createStyles";
import withStyles from "@mui/styles/withStyles";
import { Grid } from "@mui/material";
import { useSelector } from "react-redux";
import { AppState } from "../../store";
import { xtos, stox } from "./xlsxspread";
import { ProgressBar } from "mds";

import * as XLSX from 'xlsx';
import Spreadsheet from "x-data-spreadsheet";
import "x-data-spreadsheet/dist/xspreadsheet.css";
import 'handsontable/dist/handsontable.full.css';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
const iconv = require('iconv-lite');

registerAllModules();

const styles = () => createStyles({
  sheetContainer: {
    position: 'absolute',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
  }
});

const Sheet = ({ classes }: any) => {
  const [url, setUrl] = React.useState<any>("");
  const [loading, setLoading] = React.useState(true);
  const [mount, setMount] = React.useState(true);
  const [data, setData] = React.useState<any>([]);
  const ref = React.useRef<any>(); 
  const sheet = React.useRef<any>();

  const measuredRef = useCallback((node: any) => {
    if (node !== null) {
      ref.current = node;
      //if (!sheet.current) sheet.current = new Spreadsheet(ref.current);
      if (!sheet.current) sheet.current = window.luckysheet.create({ container: 'sheet-container', showinfobar: false });
      setMount(true)
    }
  }, []);

  const load = async (url: any) => {
    setUrl(url);
    const s = await (await fetch(url)).arrayBuffer()
    const wb = XLSX.read(s);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(ws, { header: 1, defval: '' });
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const ncols = range.e.c - range.s.c + 1, nrows = range.e.r - range.s.r + 1;
    console.log(rows, range, ncols, nrows);
    setData(rows);
    //sheet.current.loadData(stox(wb));

    setLoading(false);
  }
  
  useEffect(() => {
    if(!mount) return;
    let params = (new URL(window.location.href)).searchParams;
    const url = params.get("url");
    load(url).then(() => {

    });
  }, [mount])

  return (<>
    {!data || loading && 
    <Grid item xs={12}>
      <ProgressBar />
    </Grid>}
    {true && data && !loading && <HotTable
      data={data}
      rowHeaders={true}
      colHeaders={true}
      dropdownMenu={true}
      contextMenu={true}
      search={true}
      licenseKey="non-commercial-and-evaluation"
    />}
    {false && <div id="sheet-container" ref={measuredRef} className={data && !loading && classes.sheetContainer || "" }/>}
  </>);
};

export default withStyles(styles)(Sheet);
