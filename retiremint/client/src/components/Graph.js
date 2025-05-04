import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Graph({ graphOne }) {
  const startYear = 2025;

  if (!Array.isArray(graphOne)) {
    return <div>Loading graph...</div>; 
  }

  const data = graphOne.map((value, index) => ({
    year: startYear + index,
    probability: value,
  }));

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Year', position: 'insideBottom', offset: -5 }} 
          />
          <YAxis 
            domain={[0, 100]} 
            tickFormatter={(tick) => `${tick}%`} 
            label={{ value: 'Probability of Success', angle: -90, position: 'insideLeft' }} 
          />
          <Tooltip formatter={(value) => `${value}%`} />
          <Line type="monotone" dataKey="probability" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Graph;
