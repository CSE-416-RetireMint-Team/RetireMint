// src/setupTests.js
import '@testing-library/jest-dom';
import React from 'react';

//
// 1) Stub out the Canvas API so Plotly.js never throws
//
// Jest + jsdom don’t implement getContext(), so we give it a no-op.
HTMLCanvasElement.prototype.getContext = () => ({
  // you can add drawImage / measureText / etc. here if you ever need them
});

//
// 2) Stub URL.createObjectURL so anything that calls it (Plotly, images, blobs) won’t break
//
window.URL.createObjectURL = () => '';

//
// 3) Mock the Plotly React wrapper so your tests just render a <div> instead of real charts
//
jest.mock('react-plotly.js', () => {
  // return a simple functional component
  return (props) => <div data-testid="mock-plotly" {...props} />;
});

beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });