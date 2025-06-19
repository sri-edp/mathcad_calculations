/**
 * Enhanced Math Engine for Engineering Calculator
 * Implements REQ-001 through REQ-007, REQ-030, REQ-031, REQ-033
 */

class EnhancedMathEngine {
    constructor() {
        // Initialize with enhanced configuration
        this.variables = new Map();
        this.userFunctions = new Map();
        this.constants = new Map();
        this.unitSystem = new UnitConverter();

        // Computation modes (REQ-002)
        this.computationMode = 'auto'; // 'symbolic', 'numeric', 'auto'

        // Precision settings (REQ-033)
        this.precision = {
            significantDigits: 8,
            decimalPlaces: 6,
            tolerance: 1e-12,
            outputFormat: 'auto' // 'scientific', 'engineering', 'fixed', 'auto'
        };

        // Initialize mathematical constants (REQ-020)
        this.initializeConstants();

        // Initialize engineering functions (REQ-019)
        this.initializeEngineeringFunctions();

        // Auto-save system (REQ-024)
        this.autoSaveInterval = null;
        this.lastSaveTime = Date.now();

        // Real-time update system (REQ-010)
        this.updateSubscribers = new Map();
    }

    /**
     * Initialize mathematical and physical constants (REQ-020)
     */
    initializeConstants() {
        const constants = {
            // Mathematical constants
            'pi': { value: Math.PI, description: 'Pi (π)', unit: '' },
            'e': { value: Math.E, description: 'Euler\'s number', unit: '' },
            'phi': { value: (1 + Math.sqrt(5)) / 2, description: 'Golden ratio', unit: '' },
            'gamma': { value: 0.5772156649015329, description: 'Euler-Mascheroni constant', unit: '' },

            // Physical constants
            'c': { value: 299792458, description: 'Speed of light', unit: 'm/s' },
            'h': { value: 6.62607015e-34, description: 'Planck constant', unit: 'J⋅s' },
            'hbar': { value: 1.054571817e-34, description: 'Reduced Planck constant', unit: 'J⋅s' },
            'k_B': { value: 1.380649e-23, description: 'Boltzmann constant', unit: 'J/K' },
            'N_A': { value: 6.02214076e23, description: 'Avogadro number', unit: '1/mol' },
            'R': { value: 8.314462618, description: 'Gas constant', unit: 'J/(mol⋅K)' },
            'G': { value: 6.67430e-11, description: 'Gravitational constant', unit: 'm³/(kg⋅s²)' },
            'g': { value: 9.80665, description: 'Standard gravity', unit: 'm/s²' },
            'epsilon_0': { value: 8.8541878128e-12, description: 'Vacuum permittivity', unit: 'F/m' },
            'mu_0': { value: 1.25663706212e-6, description: 'Vacuum permeability', unit: 'H/m' },

            // Engineering constants
            'rho_water': { value: 1000, description: 'Density of water (STP)', unit: 'kg/m³' },
            'rho_air': { value: 1.225, description: 'Density of air (STP)', unit: 'kg/m³' },
            'E_steel': { value: 200e9, description: 'Young\'s modulus of steel', unit: 'Pa' },
            'E_aluminum': { value: 70e9, description: 'Young\'s modulus of aluminum', unit: 'Pa' }
        };

        for (const [name, data] of Object.entries(constants)) {
            this.constants.set(name, data);
        }
    }

    /**
     * Initialize engineering functions (REQ-019)
     */
    initializeEngineeringFunctions() {
        const functions = {
            // Mechanical Engineering
            'stress': {
                func: (force, area) => force / area,
                params: ['force (N)', 'area (m²)'],
                description: 'Normal stress calculation',
                units: { input: ['N', 'm²'], output: 'Pa' }
            },
            'strain': {
                func: (deltaL, L) => deltaL / L,
                params: ['change_in_length (m)', 'original_length (m)'],
                description: 'Engineering strain calculation',
                units: { input: ['m', 'm'], output: '' }
            },
            'moment_of_inertia_rect': {
                func: (b, h) => (b * Math.pow(h, 3)) / 12,
                params: ['width (m)', 'height (m)'],
                description: 'Moment of inertia for rectangular section',
                units: { input: ['m', 'm'], output: 'm⁴' }
            },

            // Electrical Engineering
            'ohms_law_V': {
                func: (I, R) => I * R,
                params: ['current (A)', 'resistance (Ω)'],
                description: 'Voltage from Ohm\'s law',
                units: { input: ['A', 'Ω'], output: 'V' }
            },
            'power_electrical': {
                func: (V, I) => V * I,
                params: ['voltage (V)', 'current (A)'],
                description: 'Electrical power calculation',
                units: { input: ['V', 'A'], output: 'W' }
            },

            // Fluid Mechanics
            'reynolds_number': {
                func: (rho, v, L, mu) => (rho * v * L) / mu,
                params: ['density (kg/m³)', 'velocity (m/s)', 'length (m)', 'viscosity (Pa⋅s)'],
                description: 'Reynolds number for fluid flow',
                units: { input: ['kg/m³', 'm/s', 'm', 'Pa⋅s'], output: '' }
            },
            'bernoulli_velocity': {
                func: (P1, P2, rho) => Math.sqrt(2 * (P1 - P2) / rho),
                params: ['pressure_1 (Pa)', 'pressure_2 (Pa)', 'density (kg/m³)'],
                description: 'Velocity from Bernoulli equation',
                units: { input: ['Pa', 'Pa', 'kg/m³'], output: 'm/s' }
            },

            // Thermodynamics
            'ideal_gas_pressure': {
                func: (n, R, T, V) => (n * R * T) / V,
                params: ['moles (mol)', 'gas_constant (J/(mol⋅K))', 'temperature (K)', 'volume (m³)'],
                description: 'Ideal gas law pressure calculation',
                units: { input: ['mol', 'J/(mol⋅K)', 'K', 'm³'], output: 'Pa' }
            },
            'heat_conduction': {
                func: (k, A, dT, dx) => k * A * dT / dx,
                params: ['thermal_conductivity (W/(m⋅K))', 'area (m²)', 'temp_difference (K)', 'thickness (m)'],
                description: 'Heat transfer by conduction',
                units: { input: ['W/(m⋅K)', 'm²', 'K', 'm'], output: 'W' }
            },

            // Signal Processing
            'decibel': {
                func: (P, P_ref) => 20 * Math.log10(P / P_ref),
                params: ['power', 'reference_power'],
                description: 'Decibel calculation',
                units: { input: ['W', 'W'], output: 'dB' }
            },

            // Statistics (REQ-021)
            'linear_regression': {
                func: (x_data, y_data) => {
                    const n = x_data.length;
                    const sum_x = x_data.reduce((a, b) => a + b, 0);
                    const sum_y = y_data.reduce((a, b) => a + b, 0);
                    const sum_xy = x_data.reduce((sum, x, i) => sum + x * y_data[i], 0);
                    const sum_x2 = x_data.reduce((sum, x) => sum + x * x, 0);

                    const slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x);
                    const intercept = (sum_y - slope * sum_x) / n;

                    return { slope, intercept };
                },
                params: ['x_array', 'y_array'],
                description: 'Linear regression analysis',
                units: { input: ['array', 'array'], output: 'object' }
            }
        };

        for (const [name, func] of Object.entries(functions)) {
            this.userFunctions.set(name, func);
        }
    }

    /**
     * Declare a variable with units and scope (REQ-030)
     */
    declareVariable(name, value, unit = '', description = '', scope = 'global') {
        if (!this.isValidVariableName(name)) {
            throw new Error(`Invalid variable name: ${name}`);
        }

        // Parse value with unit checking
        const parsedValue = this.parseValueWithUnits(value, unit);

        const variable = {
            name,
            value: parsedValue.value,
            unit: parsedValue.unit || unit,
            description,
            scope,
            type: this.inferType(parsedValue.value),
            timestamp: Date.now()
        };

        this.variables.set(name, variable);
        this.triggerAutoSave();
        this.notifySubscribers('variable', name, variable);

        return variable;
    }

    /**
     * Enhanced expression evaluation with symbolic/numeric modes (REQ-001, REQ-002)
     */
    evaluate(expression, variables = {}, mode = null) {
        const evalMode = mode || this.computationMode;

        try {
            // Build evaluation context
            const context = this.buildEvaluationContext(variables);

            // Parse expression with unit awareness (REQ-003)
            const parsedExpr = this.parseExpressionWithUnits(expression);

            let result;
            switch (evalMode) {
                case 'symbolic':
                    result = this.evaluateSymbolic(parsedExpr, context);
                    break;
                case 'numeric':
                    result = this.evaluateNumeric(parsedExpr, context);
                    break;
                case 'auto':
                default:
                    result = this.evaluateAuto(parsedExpr, context);
                    break;
            }

            // Apply precision formatting (REQ-033)
            result.formatted = this.formatResult(result.value, result.unit);

            return {
                success: true,
                result: result.value,
                unit: result.unit,
                formatted: result.formatted,
                mode: evalMode,
                type: result.type,
                expression: expression
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                expression: expression,
                mode: evalMode
            };
        }
    }

    /**
     * Parse expression with unit awareness (REQ-003)
     */
    parseExpressionWithUnits(expression) {
        // Enhanced parsing to handle units in expressions
        const unitPattern = /(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*([a-zA-Z²³⁴⁵⁶⁷⁸⁹⁰\/\*\(\)]+)/g;

        let parsedExpr = expression;
        const units = [];

        parsedExpr = parsedExpr.replace(unitPattern, (match, value, unit) => {
            units.push({ value: parseFloat(value), unit });
            return value;
        });

        return {
            expression: parsedExpr,
            units: units,
            original: expression
        };
    }

    /**
     * Complex number operations (REQ-004)
     */
    createComplex(real, imaginary = 0) {
        return {
            real: real,
            imag: imaginary,
            type: 'complex'
        };
    }

    complexAdd(a, b) {
        return this.createComplex(a.real + b.real, a.imag + b.imag);
    }

    complexMultiply(a, b) {
        return this.createComplex(
            a.real * b.real - a.imag * b.imag,
            a.real * b.imag + a.imag * b.real
        );
    }

    complexMagnitude(c) {
        return Math.sqrt(c.real * c.real + c.imag * c.imag);
    }

    complexPhase(c) {
        return Math.atan2(c.imag, c.real);
    }

    /**
     * Matrix operations (REQ-005)
     */
    createMatrix(data) {
        if (!Array.isArray(data) || !Array.isArray(data[0])) {
            throw new Error('Matrix data must be a 2D array');
        }

        return {
            data: data,
            rows: data.length,
            cols: data[0].length,
            type: 'matrix'
        };
    }

    matrixMultiply(a, b) {
        if (a.cols !== b.rows) {
            throw new Error('Matrix dimensions incompatible for multiplication');
        }

        const result = Array(a.rows).fill().map(() => Array(b.cols).fill(0));

        for (let i = 0; i < a.rows; i++) {
            for (let j = 0; j < b.cols; j++) {
                for (let k = 0; k < a.cols; k++) {
                    result[i][j] += a.data[i][k] * b.data[k][j];
                }
            }
        }

        return this.createMatrix(result);
    }

    matrixDeterminant(matrix) {
        if (matrix.rows !== matrix.cols) {
            throw new Error('Determinant requires square matrix');
        }

        const n = matrix.rows;
        const data = matrix.data.map(row => [...row]); // Deep copy

        let det = 1;
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(data[k][i]) > Math.abs(data[maxRow][i])) {
                    maxRow = k;
                }
            }

            if (maxRow !== i) {
                [data[i], data[maxRow]] = [data[maxRow], data[i]];
                det *= -1;
            }

            if (Math.abs(data[i][i]) < 1e-10) {
                return 0;
            }

            det *= data[i][i];

            // Eliminate column
            for (let k = i + 1; k < n; k++) {
                const factor = data[k][i] / data[i][i];
                for (let j = i; j < n; j++) {
                    data[k][j] -= factor * data[i][j];
                }
            }
        }

        return det;
    }

    /**
     * Equation solving (REQ-006)
     */
    solveEquation(equation, variable, method = 'numeric') {
        try {
            // Parse equation
            const [leftSide, rightSide] = equation.split('=').map(s => s.trim());

            if (method === 'symbolic') {
                return this.solveSymbolic(leftSide, rightSide, variable);
            } else {
                return this.solveNumeric(leftSide, rightSide, variable);
            }
        } catch (error) {
            throw new Error(`Equation solving failed: ${error.message}`);
        }
    }

    solveNumeric(leftExpr, rightExpr, variable, initialGuess = 0) {
        // Newton-Raphson method
        const f = (x) => {
            const context = { [variable]: x, ...this.buildEvaluationContext() };
            const left = this.evaluateExpression(leftExpr, context);
            const right = this.evaluateExpression(rightExpr, context);
            return left - right;
        };

        const df = (x, h = 1e-8) => {
            return (f(x + h) - f(x - h)) / (2 * h);
        };

        let x = initialGuess;
        const maxIterations = 100;
        const tolerance = this.precision.tolerance;

        for (let i = 0; i < maxIterations; i++) {
            const fx = f(x);

            if (Math.abs(fx) < tolerance) {
                return {
                    solution: x,
                    iterations: i,
                    residual: fx,
                    method: 'Newton-Raphson'
                };
            }

            const dfx = df(x);
            if (Math.abs(dfx) < tolerance) {
                throw new Error('Derivative too small, method may not converge');
            }

            x = x - fx / dfx;
        }

        throw new Error('Failed to converge within maximum iterations');
    }

    /**
     * Differentiation (REQ-006)
     */
    differentiate(expression, variable, order = 1) {
        // Numerical differentiation using finite differences
        const h = 1e-8;

        return (x) => {
            const context = { [variable]: x, ...this.buildEvaluationContext() };

            if (order === 1) {
                const left = this.evaluateExpression(expression, { ...context, [variable]: x - h });
                const right = this.evaluateExpression(expression, { ...context, [variable]: x + h });
                return (right - left) / (2 * h);
            } else if (order === 2) {
                const left = this.evaluateExpression(expression, { ...context, [variable]: x - h });
                const center = this.evaluateExpression(expression, context);
                const right = this.evaluateExpression(expression, { ...context, [variable]: x + h });
                return (right - 2 * center + left) / (h * h);
            } else {
                throw new Error('Higher order derivatives not implemented');
            }
        };
    }

    /**
     * Integration (REQ-006)
     */
    integrate(expression, variable, lowerBound, upperBound, method = 'simpson') {
        const f = (x) => {
            const context = { [variable]: x, ...this.buildEvaluationContext() };
            return this.evaluateExpression(expression, context);
        };

        if (method === 'simpson') {
            return this.simpsonRule(f, lowerBound, upperBound);
        } else if (method === 'trapezoidal') {
            return this.trapezoidalRule(f, lowerBound, upperBound);
        } else {
            throw new Error('Unknown integration method');
        }
    }

    simpsonRule(f, a, b, n = 1000) {
        if (n % 2 !== 0) n++;

        const h = (b - a) / n;
        let sum = f(a) + f(b);

        for (let i = 1; i < n; i++) {
            const x = a + i * h;
            sum += (i % 2 === 0 ? 2 : 4) * f(x);
        }

        return (h / 3) * sum;
    }

    /**
     * User-defined functions (REQ-007, REQ-025)
     */
    defineFunction(name, parameters, body, description = '') {
        if (!this.isValidVariableName(name)) {
            throw new Error('Invalid function name');
        }

        const func = {
            name,
            parameters,
            body,
            description,
            type: 'user-defined',
            created: Date.now(),
            func: (...args) => {
                if (args.length !== parameters.length) {
                    throw new Error(`Function ${name} expects ${parameters.length} arguments`);
                }

                const context = {};
                parameters.forEach((param, i) => {
                    context[param] = args[i];
                });

                return this.evaluateExpression(body, context);
            }
        };

        this.userFunctions.set(name, func);
        return func;
    }

    /**
     * Auto-save functionality (REQ-024)
     */
    enableAutoSave(callback, interval = 30000) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(() => {
            this.triggerAutoSave(callback);
        }, interval);
    }

    triggerAutoSave(callback) {
        const data = this.serialize();
        if (callback) {
            callback(data);
        }

        // Show auto-save indicator
        this.showAutoSaveIndicator();
        this.lastSaveTime = Date.now();
    }

    showAutoSaveIndicator() {
        const indicator = document.getElementById('autosave-indicator');
        if (indicator) {
            indicator.classList.add('visible');
            setTimeout(() => {
                indicator.classList.remove('visible');
            }, 2000);
        }
    }

    /**
     * Real-time update system (REQ-010)
     */
    subscribe(type, callback) {
        if (!this.updateSubscribers.has(type)) {
            this.updateSubscribers.set(type, new Set());
        }
        this.updateSubscribers.get(type).add(callback);
    }

    notifySubscribers(type, name, data) {
        if (this.updateSubscribers.has(type)) {
            this.updateSubscribers.get(type).forEach(callback => {
                try {
                    callback(name, data);
                } catch (error) {
                    console.error('Subscriber callback error:', error);
                }
            });
        }
    }

    /**
     * Precision formatting (REQ-033)
     */
    formatResult(value, unit = '') {
        if (typeof value === 'object' && value.type === 'complex') {
            return this.formatComplex(value) + (unit ? ` ${unit}` : '');
        }

        if (typeof value === 'object' && value.type === 'matrix') {
            return this.formatMatrix(value);
        }

        if (typeof value !== 'number') {
            return String(value);
        }

        const { significantDigits, decimalPlaces, outputFormat } = this.precision;

        let formatted;
        switch (outputFormat) {
            case 'scientific':
                formatted = value.toExponential(significantDigits - 1);
                break;
            case 'engineering':
                const exp = Math.floor(Math.log10(Math.abs(value)) / 3) * 3;
                const mantissa = value / Math.pow(10, exp);
                formatted = `${mantissa.toFixed(decimalPlaces)}e${exp}`;
                break;
            case 'fixed':
                formatted = value.toFixed(decimalPlaces);
                break;
            case 'auto':
            default:
                if (Math.abs(value) >= 1e6 || (Math.abs(value) < 1e-3 && value !== 0)) {
                    formatted = value.toExponential(significantDigits - 1);
                } else {
                    formatted = parseFloat(value.toPrecision(significantDigits)).toString();
                }
                break;
        }

        return formatted + (unit ? ` ${unit}` : '');
    }

    formatComplex(complex) {
        const real = this.formatResult(complex.real);
        const imag = Math.abs(complex.imag);
        const sign = complex.imag >= 0 ? '+' : '-';

        if (complex.real === 0) {
            return complex.imag === 1 ? 'i' : complex.imag === -1 ? '-i' : `${complex.imag}i`;
        }

        if (complex.imag === 0) {
            return real;
        }

        return `${real} ${sign} ${imag === 1 ? '' : imag}i`;
    }

    formatMatrix(matrix) {
        return matrix.data.map(row =>
            '[' + row.map(val => this.formatResult(val)).join(', ') + ']'
        ).join('\n');
    }

    /**
     * Utility methods
     */
    isValidVariableName(name) {
        return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name) && !this.constants.has(name);
    }

    inferType(value) {
        if (typeof value === 'number') return 'number';
        if (typeof value === 'object' && value.type) return value.type;
        if (Array.isArray(value)) return 'array';
        return 'unknown';
    }

    parseValueWithUnits(value, expectedUnit = '') {
        if (typeof value === 'string') {
            // Try to extract number and unit from string
            const match = value.match(/^([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s*(.*)$/);
            if (match) {
                return {
                    value: parseFloat(match[1]),
                    unit: match[2].trim() || expectedUnit
                };
            }
        }

        return {
            value: parseFloat(value),
            unit: expectedUnit
        };
    }

    buildEvaluationContext(additionalVars = {}) {
        const context = {};

        // Add constants
        for (const [name, data] of this.constants) {
            context[name] = data.value;
        }

        // Add variables
        for (const [name, variable] of this.variables) {
            context[name] = variable.value;
        }

        // Add additional variables
        Object.assign(context, additionalVars);

        return context;
    }

    evaluateExpression(expr, context) {
        // Basic expression evaluator - in production would use math.js or similar
        try {
            const func = new Function(...Object.keys(context), `return ${expr}`);
            return func(...Object.values(context));
        } catch (error) {
            throw new Error(`Expression evaluation failed: ${error.message}`);
        }
    }

    evaluateAuto(parsedExpr, context) {
        // Determine if symbolic or numeric evaluation is more appropriate
        const hasSymbolicVars = Object.values(context).some(v =>
            typeof v === 'object' && v.type === 'symbolic'
        );

        if (hasSymbolicVars) {
            return this.evaluateSymbolic(parsedExpr, context);
        } else {
            return this.evaluateNumeric(parsedExpr, context);
        }
    }

    evaluateSymbolic(parsedExpr, context) {
        // Symbolic evaluation - simplified implementation
        return {
            value: parsedExpr.expression,
            type: 'symbolic',
            unit: this.inferUnits(parsedExpr.units)
        };
    }

    evaluateNumeric(parsedExpr, context) {
        const result = this.evaluateExpression(parsedExpr.expression, context);
        return {
            value: result,
            type: 'numeric',
            unit: this.inferUnits(parsedExpr.units)
        };
    }

    inferUnits(units) {
        // Basic unit inference - would be more sophisticated in production
        if (units.length === 0) return '';
        if (units.length === 1) return units[0].unit;
        return 'mixed'; // Placeholder for complex unit calculations
    }

    serialize() {
        return {
            variables: Array.from(this.variables.entries()),
            userFunctions: Array.from(this.userFunctions.entries()),
            precision: this.precision,
            computationMode: this.computationMode,
            timestamp: Date.now()
        };
    }

    deserialize(data) {
        if (data.variables) {
            this.variables = new Map(data.variables);
        }
        if (data.userFunctions) {
            this.userFunctions = new Map(data.userFunctions);
        }
        if (data.precision) {
            this.precision = { ...this.precision, ...data.precision };
        }
        if (data.computationMode) {
            this.computationMode = data.computationMode;
        }
    }
}

// Unit Converter for REQ-003
class UnitConverter {
    constructor() {
        this.units = new Map();
        this.initializeUnits();
    }

    initializeUnits() {
        // Basic unit definitions - would be more comprehensive in production
        const unitDefs = {
            // Length
            'm': { base: true, factor: 1, dimension: 'length' },
            'cm': { base: false, factor: 0.01, dimension: 'length' },
            'mm': { base: false, factor: 0.001, dimension: 'length' },
            'km': { base: false, factor: 1000, dimension: 'length' },
            'in': { base: false, factor: 0.0254, dimension: 'length' },
            'ft': { base: false, factor: 0.3048, dimension: 'length' },

            // Mass
            'kg': { base: true, factor: 1, dimension: 'mass' },
            'g': { base: false, factor: 0.001, dimension: 'mass' },
            'lb': { base: false, factor: 0.453592, dimension: 'mass' },

            // Time
            's': { base: true, factor: 1, dimension: 'time' },
            'min': { base: false, factor: 60, dimension: 'time' },
            'hr': { base: false, factor: 3600, dimension: 'time' },

            // Force
            'N': { base: true, factor: 1, dimension: 'force' },
            'lbf': { base: false, factor: 4.44822, dimension: 'force' },

            // Pressure
            'Pa': { base: true, factor: 1, dimension: 'pressure' },
            'kPa': { base: false, factor: 1000, dimension: 'pressure' },
            'MPa': { base: false, factor: 1e6, dimension: 'pressure' },
            'psi': { base: false, factor: 6894.76, dimension: 'pressure' }
        };

        for (const [unit, def] of Object.entries(unitDefs)) {
            this.units.set(unit, def);
        }
    }

    convert(value, fromUnit, toUnit) {
        const from = this.units.get(fromUnit);
        const to = this.units.get(toUnit);

        if (!from || !to) {
            throw new Error(`Unknown unit: ${!from ? fromUnit : toUnit}`);
        }

        if (from.dimension !== to.dimension) {
            throw new Error(`Incompatible dimensions: ${from.dimension} vs ${to.dimension}`);
        }

        // Convert to base unit, then to target unit
        const baseValue = value * from.factor;
        return baseValue / to.factor;
    }
}

// Global instance
const enhancedMathEngine = new EnhancedMathEngine();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedMathEngine, UnitConverter };
}