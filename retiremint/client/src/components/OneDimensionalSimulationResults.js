import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MutipleLine from './MutipleLine';
import FiveTwoGraph from './FiveTwoGraph';
import Header from './HeaderComp';

const OneDimensionalSimulationResults = () => {
  const location = useLocation();
  const [exploreDatas, setExploreDatas] = useState(() => location.state?.exploreResults || {});

  useEffect(() => {
    console.log('Explore Data:', exploreDatas);
  }, [exploreDatas]);

  return (
    <div>
      <Header />
      <h1>One-dimensional scenario exploration</h1>
      <MutipleLine exploreDatas={exploreDatas}/>
      <FiveTwoGraph exploreDatas={exploreDatas}/>
    </div>
  );
};

export default OneDimensionalSimulationResults;