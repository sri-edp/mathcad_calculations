/**
 * JavaScript Math Engine for Engineering Calculator
 * Provides client-side math functionality
 */

class MathEngine {
    constructor() {
        // Initialize math.js with custom settings
        this.mathjs = math.create({
            number: 'number',
            precision: 64
        });

        // Add custom functions and constants
        this.initializeCustomFunctions();
    }

        /**
     * Initialize custom functions and constants
     */
    initializeCustomFunctions() {
        // Define additional engineering constants
        this.mathjs.createUnit('g_n', '9.80665 m/s^2', {override: true});  // Standard gravity

        // Define commonly used engineering functions

        // Stress and strain calculations
        this.mathjs.import({
            stress: function(force, area) {
                return force / area;
            },
            strain: function(deformation, originalLength) {
                return deformation / originalLength;
            },
            youngsModulus: function(stress, strain) {
                return stress / strain;
            }
        });

        // Fluid mechanics
        this.mathjs.import({
            reynoldsNumber: function(density, velocity, characteristicLength, dynamicViscosity) {
                return (density * velocity * characteristicLength) / dynamicViscosity;
            },
            bernoulliEquation: function(velocity1, height1, pressure1, velocity2, height2, pressure2, density, gravity) {
                const g = gravity || 9.80665;
                return pressure1 + 0.5 * density * Math.pow(velocity1, 2) + density * g * height1 ===
                       pressure2 + 0.5 * density * Math.pow(velocity2, 2) + density * g * height2;
            }
        });

        // Thermodynamics
        this.mathjs.import({
            heatTransfer: function(thermalConductivity, area, tempDiff, thickness) {
                return thermalConductivity * area * tempDiff / thickness;
            }
        });

        // Electrical engineering
        this.mathjs.import({
            ohmsLaw: function(voltage, current, resistance) {
                // Calculate the missing parameter
                if (voltage === undefined) return current * resistance;
                if (current === undefined) return voltage / resistance;
                if (resistance === undefined) return voltage / current;
                return null;
            },
            powerElectrical: function(voltage, current) {
                return voltage * current;
            }
        });
    }

    /**
     * Evaluate a mathematical expression
     * @param {string} expression - The expression to evaluate
     * @param {object} variables - Object containing variable values
     * @returns {number|array|object} - The evaluation result
     */
    evaluate(expression, variables = {}) {
        try {
            return this.mathjs.evaluate(expression, variables);
        } catch (error) {
            console.error('Evaluation error:', error);
            throw error;
        }
    }

    /**
     * Solve an equation for a variable
     * @param {string} equation - The equation to solve (e.g., "x + y = 10")
     * @param {string} variable - The variable to solve for
     * @param {object} knownVariables - Object containing known variable values
     * @returns {Array} - Array of solutions
     */
    solveEquation(equation, variable, knownVariables = {}) {
        try {
            // Parse the equation into left and right sides
            let left, right;

            if (equation.includes('=')) {
                [left, right] = equation.split('=').map(side => side.trim());
            } else {
                // If no equals sign, assume equation is set to zero
                left = equation.trim();
                right = '0';
            }

            // Create the equation: left - right = 0
            const expr = this.mathjs.parse(`${left}-(${right})`);

            // Substitute known variables
            const substituted = expr.evaluate(knownVariables);

            // Convert to string and solve
            const equationStr = substituted.toString();

            // Use the numeric solver to find roots
            const solutions = this.mathjs.solve(equationStr, variable);

            return solutions;
        } catch (error) {
            console.error('Equation solving error:', error);
            throw error;
        }
    }

    /**
     * Perform symbolic differentiation
     * @param {string} expression - The expression to differentiate
     * @param {string} variable - The variable to differentiate with respect to
     * @param {number} order - The order of differentiation (default: 1)
     * @returns {string} - The differentiated expression
     */
    differentiate(expression, variable, order = 1) {
        try {
            const expr = this.mathjs.parse(expression);
            let result = expr;

            for (let i = 0; i < order; i++) {
                result = this.mathjs.derivative(result, variable);
            }

            return result.toString();
        } catch (error) {
            console.error('Differentiation error:', error);
            throw error;
        }
    }

    /**
     * Perform symbolic integration
     * @param {string} expression - The expression to integrate
     * @param {string} variable - The variable to integrate with respect to
     * @returns {string} - The integrated expression
     */
    integrate(expression, variable) {
        try {
            // For client-side we'll use a simplified approach
            // Full symbolic integration would require more sophisticated libraries
            throw new Error('Symbolic integration is only available server-side. Use the API endpoint instead.');
        } catch (error) {
            console.error('Integration error:', error);
            throw error;
        }
    }

    /**
     * Perform numerical integration
     * @param {Function} func - The function to integrate
     * @param {number} lower - Lower bound
     * @param {number} upper - Upper bound
     * @param {number} steps - Number of integration steps (default: 1000)
     * @returns {number} - The definite integral value
     */
    numericalIntegrate(func, lower, upper, steps = 1000) {
        try {
            // Implement trapezoid rule for numerical integration
            const h = (upper - lower) / steps;
            let sum = 0.5 * (func(lower) + func(upper));

            for (let i = 1; i < steps; i++) {
                const x = lower + i * h;
                sum += func(x);
            }

            return sum * h;
        } catch (error) {
            console.error('Numerical integration error:', error);
            throw error;
        }
    }

    /**
     * Evaluate an expression with units
     * @param {string} expression - The expression with units
     * @returns {object} - Result with value and unit information
     */
    evaluateWithUnits(expression) {
        try {
            const result = this.mathjs.evaluate(expression);

            if (typeof result === 'object' && result.hasOwnProperty('value') && result.hasOwnProperty('unit')) {
                // It's a unit object
                return {
                    value: result.value,
                    unit: result.unit.toString(),
                    formatted: result.toString()
                };
            } else {
                // Regular number or expression result
                return {
                    value: result,
                    unit: null,
                    formatted: result.toString()
                };
            }
        } catch (error) {
            console.error('Unit evaluation error:', error);
            throw error;
        }
    }

    /**
     * Convert a value from one unit to another
     * @param {number} value - The value to convert
     * @param {string} fromUnit - Source unit
     * @param {string} toUnit - Target unit
     * @returns {number} - The converted value
     */
    convertUnit(value, fromUnit, toUnit) {
        try {
            const source = this.mathjs.unit(value, fromUnit);
            const result = source.to(toUnit);
            return result.value;
        } catch (error) {
            console.error('Unit conversion error:', error);
            throw error;
        }
    }

    /**
     * Calculate statistics for a dataset
     * @param {Array} data - Array of numeric values
     * @returns {object} - Statistical measures
     */
    calculateStatistics(data) {
        try {
            return {
                min: this.mathjs.min(data),
                max: this.mathjs.max(data),
                mean: this.mathjs.mean(data),
                median: this.mathjs.median(data),
                standardDeviation: this.mathjs.std(data),
                variance: this.mathjs.variance(data)
            };
        } catch (error) {
            console.error('Statistics calculation error:', error);
            throw error;
        }
    }

    /**
     * Perform linear regression
     * @param {Array} xValues - Independent variable values
     * @param {Array} yValues - Dependent variable values
     * @returns {object} - Regression results (slope, intercept, r-squared)
     */
    linearRegression(xValues, yValues) {
        try {
            if (xValues.length !== yValues.length) {
                throw new Error('X and Y arrays must have the same length');
            }

            const n = xValues.length;

            // Calculate means
            const xMean = this.mathjs.mean(xValues);
            const yMean = this.mathjs.mean(yValues);

            // Calculate slope and intercept
            let numerator = 0;
            let denominator = 0;

            for (let i = 0; i < n; i++) {
                numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
                denominator += Math.pow(xValues[i] - xMean, 2);
            }

            const slope = numerator / denominator;
            const intercept = yMean - slope * xMean;

            // Calculate R-squared
            let ssr = 0; // Sum of squared regression
            let sst = 0; // Total sum of squares

            for (let i = 0; i < n; i++) {
                const prediction = slope * xValues[i] + intercept;
                ssr += Math.pow(prediction - yMean, 2);
                sst += Math.pow(yValues[i] - yMean, 2);
            }

            const rSquared = ssr / sst;

            return {
                slope,
                intercept,
                rSquared,
                equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`
            };
        } catch (error) {
            console.error('Linear regression error:', error);
            throw error;
        }
    }
}

// Create a global instance
const mathEngine = new MathEngine();


/**
 * Unit conversion utilities for the Engineering Calculator
 */

// Common unit conversion factors
const unitConversions = {
    // Length
    'm_to_cm': 100,
    'm_to_mm': 1000,
    'm_to_km': 0.001,
    'm_to_in': 39.3701,
    'm_to_ft': 3.28084,
    'm_to_yd': 1.09361,
    'm_to_mi': 0.000621371,

    // Mass
    'kg_to_g': 1000,
    'kg_to_mg': 1000000,
    'kg_to_lb': 2.20462,
    'kg_to_oz': 35.274,

    // Time
    's_to_ms': 1000,
    's_to_min': 1/60,
    's_to_hr': 1/3600,

    // Area
    'm2_to_cm2': 10000,
    'm2_to_ft2': 10.7639,
    'm2_to_acre': 0.000247105,

    // Volume
    'm3_to_L': 1000,
    'm3_to_mL': 1000000,
    'm3_to_gal': 264.172,

    // Velocity
    'mps_to_kmph': 3.6,
    'mps_to_mph': 2.23694,

    // Force
    'N_to_lbf': 0.224809,
    'N_to_kgf': 0.101972,

    // Pressure
    'Pa_to_kPa': 0.001,
    'Pa_to_MPa': 0.000001,
    'Pa_to_bar': 0.00001,
    'Pa_to_psi': 0.000145038,
    'Pa_to_atm': 9.86923e-6,

    // Energy
    'J_to_kJ': 0.001,
    'J_to_MJ': 0.000001,
    'J_to_kWh': 2.77778e-7,
    'J_to_cal': 0.239006,
    'J_to_kcal': 0.000239006,
    'J_to_Btu': 0.000947817,

    // Power
    'W_to_kW': 0.001,
    'W_to_MW': 0.000001,
    'W_to_hp': 0.00134102
};

/**
 * Convert a value from one unit to another
 * @param {number} value - Value to convert
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 * @returns {Object} The converted value with unit info
 */
function convertUnit(value, fromUnit, toUnit) {
    // Check for direct conversion factor
    const conversionKey = `${fromUnit}_to_${toUnit}`;
    if (unitConversions[conversionKey]) {
        const result = value * unitConversions[conversionKey];
        return {
            value: result,
            unit: toUnit,
            formatted: `${result} ${toUnit}`
        };
    }

    // Check for inverse conversion factor
    const inverseKey = `${toUnit}_to_${fromUnit}`;
    if (unitConversions[inverseKey]) {
        const result = value / unitConversions[inverseKey];
        return {
            value: result,
            unit: toUnit,
            formatted: `${result} ${toUnit}`
        };
    }

    // If no direct conversion is found, use the API
    return apiConvertUnit(value, fromUnit, toUnit);
}

/**
 * Use the server API to perform unit conversion
 * @param {number} value - Value to convert
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 * @returns {Promise<Object>} Promise resolving to conversion result
 */
function apiConvertUnit(value, fromUnit, toUnit) {
    return new Promise((resolve, reject) => {
        fetch('/calculations/api/convert_unit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                value: value,
                from_unit: fromUnit,
                to_unit: toUnit
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                resolve(data.result);
            } else {
                reject(new Error(data.message));
            }
        })
        .catch(error => {
            reject(error);
        });
    });
}

/**
 * Parse a string that may contain a value with units
 * @param {string} input - Input string like "5.2 kg" or "10 m/s"
 * @returns {Object|null} Parsed value and unit, or null if parsing fails
 */
function parseValueWithUnit(input) {
    const match = input.trim().match(/^([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s*(.*)$/);

    if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2].trim();

        return {
            value: value,
            unit: unit || null,
            formatted: unit ? `${value} ${unit}` : `${value}`
        };
    }

    return null;
}

/**
 * Format a value with its unit for display
 * @param {number} value - Numeric value
 * @param {string} unit - Unit string (can be empty)
 * @param {number} precision - Number of decimal places
 * @returns {string} Formatted string with value and unit
 */
function formatValueWithUnit(value, unit, precision = 4) {
    // Format the numeric value
    let formattedValue;

    if (Number.isInteger(value)) {
        formattedValue = value.toString();
    } else {
        formattedValue = value.toPrecision(precision).replace(/\.?0+$/, '');
    }

    // Add unit if present
    return unit ? `${formattedValue} ${unit}` : formattedValue;
}

/**
 * Get common units for a physical quantity
 * @param {string} quantity - Physical quantity (e.g., 'length', 'mass')
 * @returns {Array} Array of unit objects with name and symbol
 */
function getCommonUnits(quantity) {
    const unitsByQuantity = {
        'length': [
            { name: 'Meter', symbol: 'm' },
            { name: 'Centimeter', symbol: 'cm' },
            { name: 'Millimeter', symbol: 'mm' },
            { name: 'Kilometer', symbol: 'km' },
            { name: 'Inch', symbol: 'in' },
            { name: 'Foot', symbol: 'ft' },
            { name: 'Yard', symbol: 'yd' },
            { name: 'Mile', symbol: 'mi' }
        ],
        'mass': [
            { name: 'Kilogram', symbol: 'kg' },
            { name: 'Gram', symbol: 'g' },
            { name: 'Milligram', symbol: 'mg' },
            { name: 'Pound', symbol: 'lb' },
            { name: 'Ounce', symbol: 'oz' },
            { name: 'Ton (metric)', symbol: 't' }
        ],
        'time': [
            { name: 'Second', symbol: 's' },
            { name: 'Millisecond', symbol: 'ms' },
            { name: 'Minute', symbol: 'min' },
            { name: 'Hour', symbol: 'h' },
            { name: 'Day', symbol: 'd' }
        ],
        'temperature': [
            { name: 'Kelvin', symbol: 'K' },
            { name: 'Celsius', symbol: '°C' },
            { name: 'Fahrenheit', symbol: '°F' }
        ],
        'force': [
            { name: 'Newton', symbol: 'N' },
            { name: 'Kilonewton', symbol: 'kN' },
            { name: 'Pound-force', symbol: 'lbf' },
            { name: 'Kilogram-force', symbol: 'kgf' }
        ],
        'pressure': [
            { name: 'Pascal', symbol: 'Pa' },
            { name: 'Kilopascal', symbol: 'kPa' },
            { name: 'Megapascal', symbol: 'MPa' },
            { name: 'Bar', symbol: 'bar' },
            { name: 'Atmosphere', symbol: 'atm' },
            { name: 'Pound per square inch', symbol: 'psi' }
        ],
        'energy': [
            { name: 'Joule', symbol: 'J' },
            { name: 'Kilojoule', symbol: 'kJ' },
            { name: 'Kilowatt-hour', symbol: 'kWh' },
            { name: 'Calorie', symbol: 'cal' },
            { name: 'Kilocalorie', symbol: 'kcal' },
            { name: 'British thermal unit', symbol: 'BTU' }
        ],
        'power': [
            { name: 'Watt', symbol: 'W' },
            { name: 'Kilowatt', symbol: 'kW' },
            { name: 'Megawatt', symbol: 'MW' },
            { name: 'Horsepower', symbol: 'hp' }
        ],
        'electric_current': [
            { name: 'Ampere', symbol: 'A' },
            { name: 'Milliampere', symbol: 'mA' },
            { name: 'Kiloampere', symbol: 'kA' }
        ],
        'voltage': [
            { name: 'Volt', symbol: 'V' },
            { name: 'Millivolt', symbol: 'mV' },
            { name: 'Kilovolt', symbol: 'kV' }
        ],
        'resistance': [
            { name: 'Ohm', symbol: 'Ω' },
            { name: 'Kiloohm', symbol: 'kΩ' },
            { name: 'Megaohm', symbol: 'MΩ' }
        ],
        'frequency': [
            { name: 'Hertz', symbol: 'Hz' },
            { name: 'Kilohertz', symbol: 'kHz' },
            { name: 'Megahertz', symbol: 'MHz' },
            { name: 'Gigahertz', symbol: 'GHz' }
        ],
        'angle': [
            { name: 'Radian', symbol: 'rad' },
            { name: 'Degree', symbol: '°' }
        ],
        'area': [
            { name: 'Square meter', symbol: 'm²' },
            { name: 'Square centimeter', symbol: 'cm²' },
            { name: 'Square kilometer', symbol: 'km²' },
            { name: 'Square foot', symbol: 'ft²' },
            { name: 'Hectare', symbol: 'ha' },
            { name: 'Acre', symbol: 'acre' }
        ],
        'volume': [
            { name: 'Cubic meter', symbol: 'm³' },
            { name: 'Liter', symbol: 'L' },
            { name: 'Milliliter', symbol: 'mL' },
            { name: 'Cubic centimeter', symbol: 'cm³' },
            { name: 'Gallon (US)', symbol: 'gal' },
            { name: 'Quart (US)', symbol: 'qt' },
            { name: 'Fluid ounce (US)', symbol: 'fl oz' }
        ],
        'velocity': [
            { name: 'Meters per second', symbol: 'm/s' },
            { name: 'Kilometers per hour', symbol: 'km/h' },
            { name: 'Miles per hour', symbol: 'mph' },
            { name: 'Knot', symbol: 'kn' }
        ],
        'acceleration': [
            { name: 'Meters per second squared', symbol: 'm/s²' },
            { name: 'Standard gravity', symbol: 'g' }
        ],
        'density': [
            { name: 'Kilograms per cubic meter', symbol: 'kg/m³' },
            { name: 'Grams per cubic centimeter', symbol: 'g/cm³' }
        ]
    };

    return unitsByQuantity[quantity] || [];
}