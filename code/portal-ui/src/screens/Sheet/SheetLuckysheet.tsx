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
const iconv = require('iconv-lite');

var lasturl = null;

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
  const [loading, setLoading] = React.useState(false);
  const [mount, setMount] = React.useState(false);
  const [data, setData] = React.useState<any>(null);
  const ref = React.useRef<any>(); 
  const sheet = React.useRef<any>();

  const measuredRef = useCallback((node: any) => {
    if (node !== null) {
      ref.current = node;
      setMount(true)
    }
  }, []);

  const load = async (url: any) => {
    setUrl(url);

    var name = "";
    var celldata = [];
    var nrows = 0, ncols = 0;

    if(false) {
      const s = await (await fetch(url)).arrayBuffer()
      const wb = XLSX.read(s);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { header: 1, defval: null });
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      const ncols = range.e.c - range.s.c + 1, nrows = range.e.r - range.s.r + 1;
      //console.log(rows, range, ncols, nrows);
      setData(true);
      for(var r = 0; r < rows.length; r++) {
        const row = rows[r];
        for(var c = 0; c < row.length; c++) {
          celldata.push({
            r, c, v: { m: row[c], v: row[c], ct: { fa: "@", t: "s" }}
          })
        }
      }
      name = wb.SheetNames[0]
    } else {
      const s = await (await fetch(url)).json()
      //console.log(s)
      celldata = s.celldata;
      nrows = s.nrows;
      ncols = s.ncols;
      setData(true);
    }

    const sheets = [
      {
        "name": name,
        "color": "",
        "index": 0,
        "status": 1,
        "order": 0,
        "hide": 0,
        "row": nrows,
        "column": ncols,
        "defaultRowHeight": 19,
        "defaultColWidth": 73,
        "celldata": celldata,
        "config": {
          "merge": {},
          "rowlen": {},
          "columnlen": {},
          "rowhidden": {},
          "colhidden": {},
          "borderInfo": {},
          "authority": {},
        },
        "scrollLeft": 0,
        "scrollTop": 0,
        "luckysheet_select_save": [],
        "calcChain": [],
        "isPivotTable": false,
        "pivotTable": {},
        "filter_select": {},
        "filter": null,
        "luckysheet_alternateformat_save": [],
        "luckysheet_alternateformat_save_modelCustom": [],
        "luckysheet_conditionformat_save": [],
        "frozen": {},
        "chart": [],
        "zoomRatio": 1,
        "image": [],
        "showGridLines": 1,
      },
    ];
    window.luckysheet.destroy();
    sheet.current = window.luckysheet.create({
      container: 'sheet-container',
      showinfobar: false,
      data: sheets,
      title: name,
    });
  }
  
  useEffect(() => {
    let params = (new URL(window.location.href)).searchParams;
    const url = params.get("url");
    if (lasturl == url) return;
    lasturl = url;

    setLoading(true);

    load(url).then(() => {
      setLoading(false);
    });
  }, [])

  return (<>
    {(!data || loading) && 
    <Grid item xs={12}>
      <ProgressBar />
    </Grid>}
    <div id="sheet-container" ref={measuredRef} className={data && !loading && classes.sheetContainer || ""} />
  </>);
};

export default withStyles(styles)(Sheet);
