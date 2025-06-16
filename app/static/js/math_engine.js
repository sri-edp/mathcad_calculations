/**
 * Enhanced JavaScript Math Engine for Engineering Calculator
 * Addresses REQ-001 through REQ-007, REQ-030, REQ-031
 */

class EnhancedMathEngine {
    constructor() {
        // Initialize math.js with enhanced configuration
        this.math = math.create({
            number: 'number',
            precision: 64,
            predictable: false
        });

        // Variable storage with scope and units (REQ-030)
        this.variables = new Map();
        this.customFunctions = new Map();
        this.constants = new Map();

        // Initialize built-in constants (REQ-020)
        this.initializeConstants();

        // Initialize engineering functions (REQ-019)
        this.initializeEngineeringFunctions();

        // Unit system configuration (REQ-003)
        this.unitRegistry = this.initializeUnitSystem();

        // Computation mode settings (REQ-002)
        this.computationMode = 'auto'; // 'symbolic', 'numeric', 'auto'

        // Precision settings (REQ-033)
        this.precisionSettings = {
            significantDigits: 6,
            decimalPlaces: 4,
            tolerance: 1e-12,
            outputFormat: 'auto' // 'scientific', 'engineering', 'fixed', 'auto'
        };
    }

    /**
     * Initialize mathematical and physical constants (REQ-020)
     */
    initializeConstants() {
        const constants = {
            // Mathematical constants
            'pi': Math.PI,
            'e': Math.E,
            'phi': (1 + Math.sqrt(5)) / 2, // Golden ratio
            'gamma': 0.5772156649015329, // Euler-Mascheroni constant

            // Physical constants
            'c': 299792458, // Speed of light (m/s)
            'h': 6.62607015e-34, // Planck constant (J⋅s)
            'hbar': 1.054571817e-34, // Reduced Planck constant
            'k_B': 1.380649e-23, // Boltzmann constant (J/K)
            'N_A': 6.02214076e23, // Avogadro number (1/mol)
            'R': 8.314462618, // Gas constant (J/(mol⋅K))
            'G': 6.67430e-11, // Gravitational constant (m³/(kg⋅s²))
            'g': 9.80665, // Standard gravity (m/s²)
            'epsilon_0': 8.8541878128e-12, // Vacuum permittivity (F/m)
            'mu_0': 1.25663706212e-6, // Vacuum permeability (H/m)
            'sigma': 5.670374419e-8, // Stefan-Boltzmann constant (W/(m²⋅K⁴))

            // Engineering constants
            'rho_water': 1000, // Density of water (kg/m³)
            'rho_air': 1.225, // Density of air at STP (kg/m³)
            'E_steel': 200e9, // Young's modulus of steel (Pa)
            'E_aluminum': 70e9, // Young's modulus of aluminum (Pa)
        };

        for (const [name, value] of Object.entries(constants)) {
            this.constants.set(name, {
                value: value,
                description: `Built-in constant: ${name}`,
                unit: this.getConstantUnit(name)
            });
        }
    }

    /**
     * Get appropriate unit for a constant
     */
    getConstantUnit(name) {
        const unitMap = {
            'c': 'm/s',
            'h': 'J⋅s',
            'hbar': 'J⋅s',
            'k_B': 'J/K',
            'N_A': '1/mol',
            'R': 'J/(mol⋅K)',
            'G': 'm³/(kg⋅s²)',
            'g': 'm/s²',
            'epsilon_0': 'F/m',
            'mu_0': 'H/m',
            'sigma': 'W/(m²⋅K⁴)',
            'rho_water': 'kg/m³',
            'rho_air': 'kg/m³',
            'E_steel': 'Pa',
            'E_aluminum': 'Pa'
        };
        return unitMap[name] || '';
    }

    /**
     * Initialize engineering functions (REQ-019)
     */
    initializeEngineeringFunctions() {
        const functions = {
            // Mechanical Engineering
            'stress': (force, area) => force / area,
            'strain': (deltaL, L) => deltaL / L,
            'young_modulus': (stress, strain) => stress / strain,
            'moment_of_inertia_rect': (b, h) => (b * Math.pow(h, 3)) / 12,
            'moment_of_inertia_circle': (r) => (Math.PI * Math.pow(r, 4)) / 4,
            'beam_deflection_cantilever': (P, L, E, I) => (P * Math.pow(L, 3)) / (3 * E * I),

            // Electrical Engineering
            'ohms_law_V': (I, R) => I * R,
            'ohms_law_I': (V, R) => V / R,
            'ohms_law_R': (V, I) => V / I,
            'power_electrical': (V, I) => V * I,
            'power_resistive': (I, R) => I * I * R,
            'reactance_capacitive': (f, C) => 1 / (2 * Math.PI * f * C),
            'reactance_inductive': (f, L) => 2 * Math.PI * f * L,

            // Fluid Mechanics
            'reynolds_number': (rho, v, L, mu) => (rho * v * L) / mu,
            'bernoulli_velocity': (P1, P2, rho) => Math.sqrt(2 * (P1 - P2) / rho),
            'flow_rate_volumetric': (A, v) => A * v,
            'friction_factor_laminar': (Re) => 64 / Re,

            // Thermodynamics
            'ideal_gas_pressure': (n, R, T, V) => (n * R * T) / V,
            'heat_conduction': (k, A, dT, dx) => k * A * dT / dx,
            'heat_convection': (h, A, dT) => h * A * dT,
            'thermal_efficiency': (W_out, Q_in) => W_out / Q_in,

            // Civil Engineering
            'concrete_strength': (fc_28, t) => fc_28 * (t / (4 + 0.85 * t)),
            'safety_factor': (ultimate, working) => ultimate / working,
            'soil_bearing_capacity': (c, gamma, D, Nc, Nq, Ng, B) =>
                c * Nc + gamma * D * Nq + 0.5 * gamma * B * Ng,

            // Signal Processing
            'decibel': (P, P_ref) => 20 * Math.log10(P / P_ref),
            'rms': (...values) => Math.sqrt(values.reduce((sum, v) => sum + v*v, 0) / values.length),
            'fft_frequency': (k, N, fs) => k * fs / N,

            // Statistics and Analysis (REQ-021)
            'linear_regression_slope': (x_data, y_data) => {
                const n = x_data.length;
                const sum_x = x_data.reduce((a, b) => a + b, 0);
                const sum_y = y_data.reduce((a, b) => a + b, 0);
                const sum_xy = x_data.reduce((sum, x, i) => sum + x * y_data[i], 0);
                const sum_x2 = x_data.reduce((sum, x) => sum + x * x, 0);
                return (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x);
            },
            'correlation_coefficient': (x_data, y_data) => {
                const n = x_data.length;
                const sum_x = x_data.reduce((a, b) => a + b, 0);
                const sum_y = y_data.reduce((a, b) => a + b, 0);
                const sum_xy = x_data.reduce((sum, x, i) => sum + x * y_data[i], 0);
                const sum_x2 = x_data.reduce((sum, x) => sum + x * x, 0);
                const sum_y2 = y_data.reduce((sum, y) => sum + y * y, 0);

                const numerator = n * sum_xy - sum_x * sum_y;
                const denominator = Math.sqrt((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y));
                return numerator / denominator;
            }
        };

        // Register functions with math.js
        this.math.import(functions, { override: true });

        // Store function metadata
        for (const [name, func] of Object.entries(functions)) {
            this.customFunctions.set(name, {
                func: func,
                type: 'built-in',
                description: `Built-in engineering function: ${name}`,
                parameters: this.getFunctionParameters(name)
            });
        }
    }

    /**
     * Get parameter information for built-in functions
     */
    getFunctionParameters(name) {
        const paramMap = {
            'stress': ['force (N)', 'area (m²)'],
            'strain': ['change_in_length (m)', 'original_length (m)'],
            'reynolds_number': ['density (kg/m³)', 'velocity (m/s)', 'length (m)', 'viscosity (Pa⋅s)'],
            'ohms_law_V': ['current (A)', 'resistance (Ω)'],
            'ideal_gas_pressure': ['moles (mol)', 'gas_constant (J/(mol⋅K))', 'temperature (K)', 'volume (m³)']
        };
        return paramMap[name] || [];
    }

    /**
     * Initialize unit system (REQ-003)
     */
    initializeUnitSystem() {
        // Basic unit registry implementation
        return {
            // Base SI units
            length: { base: 'm', conversions: { 'mm': 0.001, 'cm': 0.01, 'km': 1000, 'in': 0.0254, 'ft': 0.3048 }},
            mass: { base: 'kg', conversions: { 'g': 0.001, 'mg': 1e-6, 'lb': 0.453592, 'oz': 0.0283495 }},
            time: { base: 's', conversions: { 'ms': 0.001, 'min': 60, 'hr': 3600, 'day': 86400 }},
            current: { base: 'A', conversions: { 'mA': 0.001, 'μA': 1e-6, 'kA': 1000 }},
            temperature: { base: 'K', conversions: { '°C': (val) => val + 273.15, '°F': (val) => (val + 459.67) * 5/9 }},
            force: { base: 'N', conversions: { 'kN': 1000, 'lbf': 4.44822, 'dyn': 1e-5 }},
            pressure: { base: 'Pa', conversions: { 'kPa': 1000, 'MPa': 1e6, 'bar': 1e5, 'psi': 6894.76, 'atm': 101325 }},
            energy: { base: 'J', conversions: { 'kJ': 1000, 'MJ': 1e6, 'cal': 4.184, 'kWh': 3.6e6, 'BTU': 1055.06 }},
            power: { base: 'W', conversions: { 'kW': 1000, 'MW': 1e6, 'hp': 745.7 }}
        };
    }

    /**
     * Declare a variable with units and scope (REQ-030)
     */
    declareVariable(name, value, unit = '', description = '', scope = 'global') {
        if (!this.isValidVariableName(name)) {
            throw new Error(`Invalid variable name: ${name}`);
        }

        const processedValue = this.parseValue(value);
        const validatedUnit = this.validateUnit(unit);

        this.variables.set(name, {
            value: processedValue,
            unit: validatedUnit,
            description: description,
            scope: scope,
            type: this.inferType(processedValue),
            timestamp: Date.now()
        });

        return this.variables.get(name);
    }

    /**
     * Validate variable name (REQ-030)
     */
    isValidVariableName(name) {
        return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name) && !this.constants.has(name);
    }

    /**
     * Parse and validate input values
     */
    parseValue(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            // Handle complex numbers (REQ-004)
            if (value.includes('i') || value.includes('j')) {
                return this.parseComplexNumber(value);
            }

            // Handle expressions
            try {
                return this.math.evaluate(value);
            } catch (e) {
                throw new Error(`Cannot parse value: ${value}`);
            }
        }

        // Handle arrays/matrices (REQ-005)
        if (Array.isArray(value)) {
            return this.math.matrix(value);
        }

        return value;
    }

    /**
     * Parse complex numbers (REQ-004)
     */
    parseComplexNumber(str) {
        // Handle formats like "3+4i", "2-5j", "i", "-i"
        const complexPattern = /^([+-]?\d*\.?\d*)\s*([+-]?\s*\d*\.?\d*)[ij]$/;
        const match = str.trim().match(complexPattern);

        if (match) {
            const real = parseFloat(match[1]) || 0;
            const imag = parseFloat(match[2].replace(/\s/g, '')) || 1;
            return this.math.complex(real, imag);
        }

        // Handle pure imaginary numbers
        if (str.trim() === 'i' || str.trim() === 'j') {
            return this.math.complex(0, 1);
        }
        if (str.trim() === '-i' || str.trim() === '-j') {
            return this.math.complex(0, -1);
        }

        throw new Error(`Invalid complex number format: ${str}`);
    }

    /**
     * Validate and normalize units (REQ-003)
     */
    validateUnit(unit) {
        if (!unit) return '';

        // Basic unit validation - in production, would use a full unit library
        const validUnits = Object.values(this.unitRegistry).flatMap(category =>
            [category.base, ...Object.keys(category.conversions)]
        );

        // Allow compound units
        const compoundPattern = /^[a-zA-Z°⋅⁻¹²³⁴⁵⁶⁷⁸⁹⁰\/\(\)\s\*]+$/;
        if (compoundPattern.test(unit)) {
            return unit;
        }

        throw new Error(`Invalid unit: ${unit}`);
    }

    /**
     * Infer type of a value
     */
    inferType(value) {
        if (typeof value === 'number') return 'number';
        if (this.math.isComplex(value)) return 'complex';
        if (this.math.isMatrix(value)) return 'matrix';
        if (Array.isArray(value)) return 'array';
        return 'expression';
    }

    /**
     * Evaluate mathematical expressions with full feature support (REQ-001, REQ-002)
     */
    evaluate(expression, variables = {}, mode = null) {
        const evalMode = mode || this.computationMode;

        try {
            // Prepare evaluation context
            const context = this.buildEvaluationContext(variables);

            // Handle different computation modes (REQ-002)
            switch (evalMode) {
                case 'symbolic':
                    return this.evaluateSymbolic(expression, context);
                case 'numeric':
                    return this.evaluateNumeric(expression, context);
                case 'auto':
                default:
                    return this.evaluateAuto(expression, context);
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                expression: expression
            };
        }
    }

    /**
     * Build evaluation context with variables and constants
     */
    buildEvaluationContext(userVariables = {}) {
        const context = {};

        // Add constants
        for (const [name, constant] of this.constants) {
            context[name] = constant.value;
        }

        // Add declared variables
        for (const [name, variable] of this.variables) {
            context[name] = variable.value;
        }

        // Add user-provided variables
        for (const [name, value] of Object.entries(userVariables)) {
            if (typeof value === 'object' && value.value !== undefined) {
                context[name] = value.value;
            } else {
                context[name] = value;
            }
        }

        return context;
    }

    /**
     * Evaluate in symbolic mode
     */
    evaluateSymbolic(expression, context) {
        // For symbolic computation, we'd integrate with a symbolic math library
        // For now, return the expression with substitutions
        let symbolic = expression;

        for (const [name, value] of Object.entries(context)) {
            if (typeof value === 'number') {
                const regex = new RegExp(`\\b${name}\\b`, 'g');
                symbolic = symbolic.replace(regex, value.toString());
            }
        }

        return {
            success: true,
            result: symbolic,
            type: 'symbolic',
            mode: 'symbolic'
        };
    }

    /**
     * Evaluate in numeric mode
     */
    evaluateNumeric(expression, context) {
        const result = this.math.evaluate(expression, context);

        return {
            success: true,
            result: result,
            type: this.inferType(result),
            mode: 'numeric',
            formatted: this.formatResult(result)
        };
    }

    /**
     * Evaluate in auto mode
     */
    evaluateAuto(expression, context) {
        // First try numeric evaluation
        try {
            const numericResult = this.evaluateNumeric(expression, context);

            // If result contains undefined variables, switch to symbolic
            if (this.hasUndefinedVariables(expression, context)) {
                return this.evaluateSymbolic(expression, context);
            }

            return numericResult;
        } catch (error) {
            // Fall back to symbolic
            return this.evaluateSymbolic(expression, context);
        }
    }

    /**
     * Check if expression has undefined variables
     */
    hasUndefinedVariables(expression, context) {
        const variables = this.extractVariables(expression);
        return variables.some(variable => !(variable in context));
    }

    /**
     * Extract variable names from expression
     */
    extractVariables(expression) {
        const variablePattern = /[a-zA-Z][a-zA-Z0-9_]*/g;
        const matches = expression.match(variablePattern) || [];
        const mathFunctions = ['sin', 'cos', 'tan', 'log', 'ln', 'exp', 'sqrt', 'abs', 'max', 'min'];
        return [...new Set(matches)].filter(match => !mathFunctions.includes(match));
    }

    /**
     * Solve equations (REQ-006)
     */
    solveEquation(equation, variable, initialGuess = 0, method = 'numeric') {
        try {
            if (method === 'symbolic') {
                return this.solveSymbolic(equation, variable);
            } else {
                return this.solveNumeric(equation, variable, initialGuess);
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                equation: equation,
                variable: variable
            };
        }
    }

    /**
     * Numeric equation solving using Newton-Raphson method
     */
    solveNumeric(equation, variable, initialGuess) {
        // Parse equation sides
        const sides = equation.split('=');
        if (sides.length !== 2) {
            throw new Error('Equation must contain exactly one equals sign');
        }

        const leftSide = sides[0].trim();
        const rightSide = sides[1].trim();

        // Create objective function f(x) = leftSide - rightSide
        const objectiveFunction = `(${leftSide}) - (${rightSide})`;

        // Newton-Raphson iteration
        let x = initialGuess;
        const tolerance = this.precisionSettings.tolerance;
        const maxIterations = 100;

        for (let i = 0; i < maxIterations; i++) {
            const context = { [variable]: x };

            // Evaluate function at current point
            const fx = this.math.evaluate(objectiveFunction, context);

            if (Math.abs(fx) < tolerance) {
                return {
                    success: true,
                    solution: x,
                    iterations: i,
                    residual: fx,
                    method: 'Newton-Raphson'
                };
            }

            // Numerical derivative
            const h = 1e-8;
            const contextPlus = { [variable]: x + h };
            const fxh = this.math.evaluate(objectiveFunction, contextPlus);
            const derivative = (fxh - fx) / h;

            if (Math.abs(derivative) < tolerance) {
                throw new Error('Derivative too small, method may not converge');
            }

            // Newton-Raphson update
            x = x - fx / derivative;
        }

        throw new Error('Failed to converge within maximum iterations');
    }

    /**
     * Create user-defined functions (REQ-007, REQ-025)
     */
    defineFunction(name, parameters, body, description = '') {
        if (!this.isValidVariableName(name)) {
            throw new Error(`Invalid function name: ${name}`);
        }

        // Validate parameters
        for (const param of parameters) {
            if (!this.isValidVariableName(param)) {
                throw new Error(`Invalid parameter name: ${param}`);
            }
        }

        // Create function
        const func = (...args) => {
            if (args.length !== parameters.length) {
                throw new Error(`Function ${name} expects ${parameters.length} arguments, got ${args.length}`);
            }

            // Create local context
            const context = {};
            parameters.forEach((param, index) => {
                context[param] = args[index];
            });

            // Evaluate function body
            return this.math.evaluate(body, context);
        };

        // Register with math.js
        this.math.import({ [name]: func }, { override: true });

        // Store metadata
        this.customFunctions.set(name, {
            func: func,
            type: 'user-defined',
            parameters: parameters,
            body: body,
            description: description,
            created: Date.now()
        });

        return {
            success: true,
            name: name,
            parameters: parameters,
            description: description
        };
    }

    /**
     * Format results according to precision settings (REQ-033)
     */
    formatResult(result) {
        if (typeof result === 'number') {
            return this.formatNumber(result);
        } else if (this.math.isComplex(result)) {
            return this.formatComplex(result);
        } else if (this.math.isMatrix(result)) {
            return this.formatMatrix(result);
        } else {
            return result.toString();
        }
    }

    /**
     * Format numbers according to precision settings
     */
    formatNumber(value) {
        const { significantDigits, decimalPlaces, outputFormat } = this.precisionSettings;

        if (Math.abs(value) < this.precisionSettings.tolerance) {
            return '0';
        }

        switch (outputFormat) {
            case 'scientific':
                return value.toExponential(significantDigits - 1);
            case 'engineering':
                const exp = Math.floor(Math.log10(Math.abs(value)) / 3) * 3;
                const mantissa = value / Math.pow(10, exp);
                return `${mantissa.toFixed(decimalPlaces)}e${exp}`;
            case 'fixed':
                return value.toFixed(decimalPlaces);
            case 'auto':
            default:
                if (Math.abs(value) >= 1e6 || Math.abs(value) < 1e-3) {
                    return value.toExponential(significantDigits - 1);
                } else {
                    return parseFloat(value.toPrecision(significantDigits)).toString();
                }
        }
    }

    /**
     * Format complex numbers (REQ-004)
     */
    formatComplex(complex) {
        const real = this.formatNumber(complex.re);
        const imag = this.formatNumber(Math.abs(complex.im));
        const sign = complex.im >= 0 ? '+' : '-';

        if (complex.re === 0) {
            return complex.im === 1 ? 'i' : complex.im === -1 ? '-i' : `${this.formatNumber(complex.im)}i`;
        } else if (complex.im === 0) {
            return real;
        } else {
            return `${real}${sign}${imag}i`;
        }
    }

    /**
     * Format matrices (REQ-005)
     */
    formatMatrix(matrix) {
        const data = matrix.toArray();
        if (Array.isArray(data[0])) {
            // 2D matrix
            return data.map(row =>
                '[' + row.map(val => this.formatNumber(val)).join(', ') + ']'
            ).join('\n');
        } else {
            // 1D vector
            return '[' + data.map(val => this.formatNumber(val)).join(', ') + ']';
        }
    }

    /**
     * Set precision settings (REQ-033)
     */
    setPrecision(settings) {
        this.precisionSettings = { ...this.precisionSettings, ...settings };
    }

    /**
     * Convert units (REQ-003)
     */
    convertUnit(value, fromUnit, toUnit) {
        // Basic unit conversion implementation
        // In production, would use a full unit library like units.js or similar

        const unitCategory = this.findUnitCategory(fromUnit);
        if (!unitCategory) {
            throw new Error(`Unknown unit: ${fromUnit}`);
        }

        const registry = this.unitRegistry[unitCategory];

        // Convert to base unit
        let baseValue;
        if (fromUnit === registry.base) {
            baseValue = value;
        } else if (registry.conversions[fromUnit]) {
            const factor = registry.conversions[fromUnit];
            baseValue = typeof factor === 'function' ? factor(value) : value * factor;
        } else {
            throw new Error(`Cannot convert from unit: ${fromUnit}`);
        }

        // Convert from base to target
        if (toUnit === registry.base) {
            return baseValue;
        } else if (registry.conversions[toUnit]) {
            const factor = registry.conversions[toUnit];
            return typeof factor === 'function' ?
                this.inverseConversion(factor, baseValue) :
                baseValue / factor;
        } else {
            throw new Error(`Cannot convert to unit: ${toUnit}`);
        }
    }

    /**
     * Find which category a unit belongs to
     */
    findUnitCategory(unit) {
        for (const [category, registry] of Object.entries(this.unitRegistry)) {
            if (unit === registry.base || registry.conversions[unit]) {
                return category;
            }
        }
        return null;
    }

    /**
     * Matrix operations (REQ-005)
     */
    matrixOperations = {
        multiply: (a, b) => this.math.multiply(a, b),
        add: (a, b) => this.math.add(a, b),
        subtract: (a, b) => this.math.subtract(a, b),
        transpose: (a) => this.math.transpose(a),
        inverse: (a) => this.math.inv(a),
        determinant: (a) => this.math.det(a),
        eigenvalues: (a) => this.math.eigs(a).values,
        eigenvectors: (a) => this.math.eigs(a).vectors,
        solve: (a, b) => this.math.lusolve(a, b)
    };

    /**
     * Get available functions and constants
     */
    getAvailableFunctions() {
        return Array.from(this.customFunctions.keys());
    }

    getAvailableConstants() {
        return Array.from(this.constants.keys());
    }

    getAvailableVariables() {
        return Array.from(this.variables.keys());
    }
}

// Global instance
const enhancedMathEngine = new EnhancedMathEngine();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedMathEngine;
}