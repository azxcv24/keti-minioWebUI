// @ts-nocheck
'use strict';
import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@nextui-org/navbar";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './agstyles.css'
import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AgGridReact } from 'ag-grid-react';
import { Link } from "@nextui-org/link";
import { Snippet } from "@nextui-org/snippet";
import { Code } from "@nextui-org/code"
import { button as buttonStyles } from "@nextui-org/theme";
import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import CssBaseline from '@mui/material/CssBaseline';
import createStyles from "@mui/styles/createStyles";
import withStyles from "@mui/styles/withStyles";
import { Pagination, Button, Box, Stack, Modal, Typography, Drawer, Divider, Grid, TextField } from '@mui/material';
import { Unstable_NumberInput as NumberInput,  numberInputClasses } from '@mui/base/Unstable_NumberInput';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";

const styles = () =>
  createStyles({
  });

function SheetAGGrid() {
  const gridRef = useRef();
  const containerStyle = useMemo(() => ({ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }), []);
  const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
  const [columnDefs, setColumnDefs] = useState([
    {
      headerName: 'ID',
      maxWidth: 100,
      valueGetter: 'node.id',
      cellRenderer: (props) => {
        if (props.value !== undefined) {
          return props.value;
        } else {
          return (
            <img src="https://www.ag-grid.com/example-assets/loading.gif" />
          );
        }
      },
    },
  ]);
  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
      resizable: true,
      minWidth: 100,
    };
  }, []);
  const [url, setUrl] = React.useState<any>("");
  const [params, setParams] = React.useState<any>({});
  const [loading, setLoading] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const filter = React.useRef('');
  const [header, setHeader] = React.useState(1);
  const headerval = React.useRef(1);

  useEffect(() => {
    let params = (new URL(window.location.href)).searchParams;
    const url = params.get("url");
    const bucket = params.get("bucket");
    const prefix = params.get("prefix");
    const version_id = params.get("version_id");
    if (url) setUrl(url)
    else setUrl(`${process.env.NEXT_PUBLIC_API_URL}/csv/preview?bucket=${bucket}&prefix=${prefix}&version_id=${version_id}`)
    setParams({ url, bucket, prefix, version_id });
  }, []);

  const onGridReady = useCallback((params) => {
    const dataSource = {
      rowCount: undefined,
      getRows: (params) => {
        console.log('asking for ' + params.startRow + ' to ' + params.endRow, "filter", filter.current);
        fetch(`${url}&format=ag&start=${params.startRow}&limit=${params.endRow - params.startRow}&header=${headerval.current||0}&filter=${filter.current && encodeURIComponent(btoa(filter.current)) || ''}`).then(resp => {
          return resp.json()
        }).then(data => {
          console.log(data)
          var headers = data.headers;

          var coldefs = [{
            headerName: 'ID',
            maxWidth: 100,
            // it is important to have node.id here, so that when the id changes (which happens
            // when the row is loaded) then the cell is refreshed.
            valueGetter: 'node.id',
            cellRenderer: (props) => {
              if (props.value !== undefined) {
                return props.value;
              } else {
                return (
                  <img src="https://www.ag-grid.com/example-assets/loading.gif" />
                );
              }
            },
          },]

          for (var i = 0; i < data.ncols; i++) {
            coldefs.push({ field: '' + i, headerName: headers[i] || undefined })
          }

          setColumnDefs(coldefs)

          var lastRow = -1;
          if (data.nrows < params.endRow) {
            lastRow = data.nrows;
          }
          params.successCallback(data.rows, lastRow);
          //gridRef.current.api.paginationGoToFirstPage();
        })
      },
    };
    params.api.setDatasource(dataSource);
  }, [url, filter, header]);

  const getRowStyle = params => {
    if (params.data && params.data.meta && params.data.meta.HL) {
      return { background: 'rgb(244 63 94)', fontWeight: 'bold' }
    }
    return {}
  }

  const apply = () => {
    console.log("filter", filter.current);
    gridRef.current.api.paginationGoToFirstPage();
    gridRef.current.api.refreshInfiniteCache();
  }

  if (!url) {
    return <></>;
  }

  return (
    <div style={containerStyle}>
      <Stack direction='row'>
        <Grid container justifyContent='space-between'>
          <Grid item xs={10} sx={{ overflowX: 'scroll'}}>
            {params.url || `bucket: ${params.bucket} prefix: ${params.prefix} version: ${params.version_id}`}
          </Grid>
          <Button variant="outlined" size="small" onClick={() => setIsModalOpen(true)}>...</Button>          
        </Grid>
      </Stack>
      <div style={gridStyle} className="ag-theme-alpine">
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowBuffer={0}
          rowSelection={'multiple'}
          rowModelType={'infinite'}
          cacheBlockSize={100}
          cacheOverflowSize={2}
          maxConcurrentDatasourceRequests={1}
          infiniteInitialRowCount={1000}
          maxBlocksInCache={10}
          onGridReady={onGridReady}
          getRowStyle={getRowStyle}
          pagination={true}
        />
      </div>
      <Drawer open={isModalOpen}
        anchor="right"
        onClose={() => setIsModalOpen(false)}
      >
        <Box sx={{ padding: 2 }} >
          <TextField
            size="small"
            label="Header row"
            value={header}
            onChange={(event) => { setHeader(event.target.value); headerval.current = event.target.value; }}
          />          
          <Typography>Input filter code(python)</Typography>
          <Box>
            <AceEditor mode="python"
              theme="monokai"
              placeholder={`def _filter(i, row):
  if i == 0:
    return True
  if len(row):
    return True
  return False
filtered = _filter(i, row)
              `}
              value={filter.current}
              onChange={(value) => filter.current = value}
            />
          </Box>
          <Stack direction="row" justifyContent='flex-end' alignItems='center' divider={<Divider orientation="vertical" flexItem />}>
            <Button variant="contained" size="small" color="error" onClick={() => setIsModalOpen(false)}>Close</Button>
            <Button variant="contained" size="small" color="primary" onClick={() => apply()}>Apply</Button>
          </Stack>
        </Box>
      </Drawer>
    </div>
  );
}

export default withStyles(styles)(SheetAGGrid);
