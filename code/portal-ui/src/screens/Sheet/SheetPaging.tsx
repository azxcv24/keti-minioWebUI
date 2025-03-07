// @ts-nocheck
import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import Sheet from './SheetAGGrid';

export default function SheetPaging() {
  const containerStyle = useMemo(() => ({ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }), []);
  return (
    <div style={containerStyle}>
      <Sheet />
    </div>
  );
};
