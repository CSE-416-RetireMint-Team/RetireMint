import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,

} from 'recharts';
import ReactEcharts from 'echarts-for-react';



function Graph() {
    const [successData, setSuccessData] = useState([]);
    const [quantityData, setQuantityData] = useState([]);
    const [selectedOption, setSelectedOption] = useState('total-investments');
    const [financialGoal, setFinancialGoal] = useState(null);

    const chartOptions = [
        { label: 'Total Investments', value: 'total-investments' },
        { label: 'Total Income', value: 'total-income' },
        { label: 'Total Expenses', value: 'total-expenses' },
        { label: 'Early Withdrawal Tax', value: 'early-withdrawal-tax' },
        { label: 'Discretionary Expenses (%)', value: 'discretionary-expense' },
    ];
    

    useEffect(() => {
        // Initial graph
        axios.get('http://localhost:8000/success-probability')
        .then(res => setSuccessData(res.data))
        .catch(err => console.error('Failed to load success graph data:', err));
    }, []);

    useEffect(() => {
        // Secondary graph (quantity-specific)
        axios.get(`http://localhost:8000/${selectedOption}`)
        .then(res => {
           
            setQuantityData(res.data);
        })
        .catch(err => console.error('Failed to load quantity data:', err));

        if (selectedOption === 'total-investments') {
        axios.get('http://localhost:8000/financial-goal')
            .then(res => setFinancialGoal(res.data.financial_goal))
            .catch(err => console.error('Failed to load financial goal:', err));
        } else {
        setFinancialGoal(null);
        }
    }, [selectedOption]);

    const getEChartsOption = () => {
        const years = quantityData.map(d => d.year);
        const median = quantityData.map(d => d.median);
    
        const p10 = quantityData.map(d => d.p10);
        const p20 = quantityData.map(d => d.p20);
        const p30 = quantityData.map(d => d.p30);
        const p40 = quantityData.map(d => d.p40);
        const p60 = quantityData.map(d => d.p60);
        const p70 = quantityData.map(d => d.p70);
        const p80 = quantityData.map(d => d.p80);
        const p90 = quantityData.map(d => d.p90);
    
        const bands = [
            { lower: p10, upper: p90, name: 'p10–p90 width', color: '#cce4f6' },
            { lower: p20, upper: p80, name: 'p20–p80 width', color: '#99caed' },
            { lower: p30, upper: p70, name: 'p30–p70 width', color: '#66afe5' },
            { lower: p40, upper: p60, name: 'p40–p60 width', color: '#3385dc' },
        ];
    
        const shadingSeries = bands.flatMap((band, i) => {
            const bandHeight = band.upper.map((val, idx) => val - band.lower[idx]);
    
            return [
                {
                    name: '',
                    type: 'line',
                    data: band.lower,
                    stack: `stack${i}`,
                    lineStyle: { color: 'transparent' },
                    areaStyle: { opacity: 0 },
                    showSymbol: false,
                    showInLegend: false,
                    tooltip: { show: false },
                },
                {
                    name: band.name,
                    type: 'line',
                    data: bandHeight,
                    stack: `stack${i}`,
                    lineStyle: { color: 'transparent' },
                    areaStyle: {
                        color: band.color,
                    },
                    showSymbol: false,
                    itemStyle: {
                        color: band.color,
                    }
                }
            ];
        });
    
        const series = [
            ...shadingSeries,
            {
                name: 'Median',
                type: 'line',
                data: median,
                lineStyle: {
                    color: 'black',
                    width: 2,
                },
                symbol: 'circle',
                symbolSize: 6,
                itemStyle: {
                    color: 'black'
                }
            },
            // Only include financial goal line when 'total-investments' is selected
            selectedOption === 'total-investments' && financialGoal !== null && {
                name: 'Financial Goal',
                type: 'line',
                data: years.map(() => financialGoal), // Financial goal line with same value across all years
                lineStyle: {
                    color: '#ff6600',
                    width: 2,
                    type: 'solid', // Solid line
                },
                symbol: 'circle',
                symbolSize: 6,
                itemStyle: {
                    color: '#ff6600',
                }
            }
        ].filter(Boolean); // Remove undefined values if financialGoal is null or option is not 'total-investments'
    
        return {
            tooltip: {
                trigger: 'axis',
            },
            xAxis: {
                type: 'category',
                data: years,
                name: 'Year',
                nameLocation: 'middle',
                nameGap: 30,
                axisLabel: {
                    margin: 10,
                },
            },
            yAxis: {
                type: 'value',
                name: 'Dollars',
                nameLocation: 'center',
                nameRotate: 90,
                axisLabel: {
                    margin: -25,
                },
                min: 'dataMin',
                max: 'dataMax',
            },
            series, // Now series is directly constructed
        };
    };
    
    
    const [part1,setPart1]=useState("investment");
    const [part2,setPart2]=useState("avg");

    const [stackData, setStackData] = useState([]);
  

    useEffect(() => {
        const endpoint = `http://localhost:8000/${part2}-${part1}`;
        axios.get(endpoint)
            .then(res => setStackData(res.data))
            .catch(err => console.error(`Error fetching data from ${endpoint}:`, err));
    }, [part1, part2]);
    


    const getColor = (index) => {
        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a78bfa', '#34d399'];
        return colors[index % colors.length]; // cycle through colors
    };
      
    // Function to render BarChart with dynamic stackData
    const renderBarChart = (stackData) => (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stackData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                {
                    // Dynamically get investment keys except for 'year'
                    stackData.length > 0 &&
                    Object.keys(stackData[0])
                        .filter(key => key !== 'year')
                        .map((key, idx) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                stackId="a"
                                fill={getColor(idx)}
                            />
                        ))
                }
            </BarChart>
        </ResponsiveContainer>
    );

          
      
      

  return (
        <div style={{ padding: '2rem' }}>
        {/* Graph 1: Line chart of probability of success over time */}
        <h2>Line chart of probability of success over time</h2>
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={successData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
            <YAxis label={{ value: "Success %", angle: -90, position: "insideLeft", offset: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="probability_of_success" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
        </ResponsiveContainer>

        {/* Graph 2: ECharts shaded line chart */}
        <div style={{ marginTop: '3rem' }}>
            <h2>Shaded line chart of probability ranges for a selected quantity over time</h2>
            <label>
            Select Quantity:&nbsp;
            <select
                value={selectedOption}
                onChange={e => setSelectedOption(e.target.value)}
                style={{ padding: '0.5rem', marginBottom: '1rem' }}
            >
                {chartOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            </label>

            <ReactEcharts
                key={selectedOption} 
                option={getEChartsOption()}
                style={{ height: '400px', width: '100%' }}
            />

        </div>


        <div style={{ padding: '2rem' }}>
        <h2>Stacked Bar Chart</h2>
        <>
        <div>
                <h3>Select Category:</h3>
                <label>
                    <input
                        type="radio"
                        name="part1"
                        value="investment"
                        checked={part1 === 'investment'}
                        onChange={() => {
                            setPart1('investment'); // Set the part1 value dynamically
                            const apiEndpoint = `http://localhost:8000/${part2}-${part1}`; // Directly combine part1 and part2
                            axios.get(apiEndpoint)
                                .then(res => setStackData(res.data))
                                .catch(err => console.error('Error fetching data:', err));
                            {renderBarChart(stackData)};
                        }}
                        
                    />
                    Investment
                </label>
                <label>
                    <input
                        type="radio"
                        name="part1"
                        value="income"
                        checked={part1 === 'income'}
                        onChange={() => {
                            setPart1('income'); // Set the part1 value dynamically
                            const apiEndpoint = `http://localhost:8000/${part2}-${part1}`; // Directly combine part1 and part2
                            axios.get(apiEndpoint)
                                .then(res => setStackData(res.data))
                                .catch(err => console.error('Error fetching data:', err));
                            {renderBarChart(stackData)}
                        }}
                    />
                    Income
                </label>
                <label>
                    <input
                        type="radio"
                        name="part1"
                        value="expenses"
                        checked={part1 === 'expenses'}
                        onChange={() => {
                            setPart1('expenses'); // Set the part1 value dynamically
                            const apiEndpoint = `http://localhost:8000/${part2}-${part1}`; // Directly combine part1 and part2
                            axios.get(apiEndpoint)
                                .then(res => setStackData(res.data))
                                .catch(err => console.error('Error fetching data:', err));
                            {renderBarChart(stackData)}
                        }}
                    />
                    Expenses
                </label>
            </div>

            <div>
                <h3>Select Type:</h3>
                <label>
                    <input
                        type="radio"
                        name="part2"
                        value="avg"
                        checked={part2 === 'avg'}
                        onChange={() => {
                            setPart2('avg'); // Set the part1 value dynamically
                            const apiEndpoint = `http://localhost:8000/${part2}-${part1}`; // Directly combine part1 and part2
                            axios.get(apiEndpoint)
                                .then(res => setStackData(res.data))
                                .catch(err => console.error('Error fetching data:', err));
                            {renderBarChart(stackData)}
                        }}
                    />
                    Average
                </label>
                <label>
                    <input
                        type="radio"
                        name="part2"
                        value="median"
                        checked={part2 === 'median'}
                        onChange={() => {
                            setPart2('median'); // Set the part1 value dynamically
                            const apiEndpoint = `http://localhost:8000/${part2}-${part1}`; // Directly combine part1 and part2
                            axios.get(apiEndpoint)
                                .then(res => setStackData(res.data))
                                .catch(err => console.error('Error fetching data:', err));
                            {renderBarChart(stackData)}
                        }}
                    />
                    Median
                </label>
            </div>

            <div>
                <h4>Selected Category: {part1}</h4>
                <h4>Selected Type: {part2}</h4>
            </div>
        </>
        {renderBarChart(stackData)}
        </div>

    </div>

    
  );
}

export default Graph;