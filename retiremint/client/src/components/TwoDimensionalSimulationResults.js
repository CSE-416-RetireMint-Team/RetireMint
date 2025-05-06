import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './HeaderComp';
import SurfacePlot from './SurfacePlot';
import ContourPlot from './ContourPlot';


const TwoDimensionalSimulationResults = () => {
  
  const location = useLocation();
  const [exploreDatas, setExploreDatas] = useState(() => location.state?.exploreResults || {});

  useEffect(() => {
    console.log('Explore Data:', exploreDatas);
  }, [exploreDatas]);


  

  return (
    <div>
       <Header />
        <h1>Two-dimensional scenario exploration</h1>
       <SurfacePlot exploreDatas={exploreDatas}/>
       < ContourPlot exploreDatas={exploreDatas} />
    </div>
    
  );
};

export default TwoDimensionalSimulationResults;