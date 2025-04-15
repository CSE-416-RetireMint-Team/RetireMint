const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for simulation result data
const SimulationResultSchema = new Schema({
  simulationIndex: Number,
  finalState: {
    totalAssets: Number,
    curYearIncome: Number,
    curYearSS: Number,
    curYearGains: Number,
    inflationRate: Number
  },
  yearlyResults: [{
    year: Number,
    totalAssets: Number,
    income: Number,
    socialSecurity: Number,
    capitalGains: Number,
    inflationRate: Number
  }]
}, { _id: false });

// Schema for visualization data
const VisualizationDataSchema = new Schema({
  finalAssetValues: [Number],
  successRate: Number,
  timeSeriesData: {
    Successful: [SimulationResultSchema],
    Unsuccessful: [SimulationResultSchema]
  }
}, { _id: false });

// Schema for visualization configuration
const VisualizationConfigSchema = new Schema({
  histogram: {
    data: Schema.Types.Mixed,
    layout: Schema.Types.Mixed
  },
  timeSeries: {
    data: Schema.Types.Mixed,
    layout: Schema.Types.Mixed
  },
  pie: {
    data: Schema.Types.Mixed,
    layout: Schema.Types.Mixed
  }
}, { _id: false });

// Main Report schema
const ReportSchema = new Schema({
  name: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  userId: { type: String, required: true }, // Google ID of user who created the report
  scenarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scenario' },
  numSimulations: { type: Number, required: true },
  numYears: { type: Number, required: true },
  financialGoal: { type: Number, required: true },
  simulationResults: [SimulationResultSchema],
  visualizationData: VisualizationDataSchema,
  visualizationConfig: VisualizationConfigSchema,
  successRate: Number,
  finalAssetStatistics: {
    // Primary field names - expected by the client
    min: Number,
    max: Number,
    mean: Number,
    median: Number,
    p10: Number, // 10th percentile
    p90: Number, // 90th percentile
    
    // Legacy field names - kept for backward compatibility
    minimum: Number,
    maximum: Number,
    average: Number
  },
  // Shared Users array
  sharedUsers: [{
    userId: {
    type: Schema.Types.ObjectId,
    ref: 'SharedUser'
    },
    email: {
      type: String,
      ref: 'Email'
    },
    permissions : {
      type: String,
      enum: ['view', 'edit'],
      ref: 'Permissions'
    }
  }]
});

module.exports = mongoose.model('Report', ReportSchema); 