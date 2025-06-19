/**
 * Enhanced Calculator Engine for Engineering Calculator
 * Implements REQ-001 through REQ-007, REQ-030, REQ-031
 */

class CalculatorEngine {
    constructor() {
        this.mathEngine = enhancedMathEngine; // Reference to global math engine
        this.variables = new Map();
        this.customFunctions = new Map();
        this.currentMode = 'numeric'; // 'numeric' or 'symbolic'
        this.precisionSettings = {
            decimalPlaces: 6,
            significantDigits: 8,
            tolerance: 1e-10,
            outputFormat: 'auto'
        };

        // Initialize programming environment
        this.programmingContext = {
            variables: {},
            functions: {},
            output: []
        };

        // Matrix editor state
        this.matrixEditors = new Map();

        // Unit conversion cache
        this.unitCache = new Map();
    }

    /**
     * Evaluate expression with unit support (REQ-001, REQ-002, REQ-003)
     */
    async evaluateExpression(expression, mode = 'auto') {
        try {
            // Prepare variables with units
            const variablesWithUnits = {};
            for (const [name, varData] of this.variables) {
                variablesWithUnits[name] = {
                    value: varData.value,
                    unit: varData.unit || ''
                };
            }

            // Send to backend for evaluation
            const response = await fetch('/calculations/api/evaluate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    expression: expression,
                    variables: variablesWithUnits,
                    mode: mode || this.currentMode
                }),
            });

            const result = await response.json();

            if (result.status === 'success') {
                return result.result;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Evaluation error:', error);
            throw error;
        }
    }

    /**
     * Solve equations (REQ-006)
     */
    async solveEquation(equation, variable, method = 'auto') {
        try {
            const response = await fetch('/calculations/api/solve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    equation: equation,
                    solving_for: variable,
                    variables: Object.fromEntries(this.variables),
                    method: method
                }),
            });

            const result = await response.json();

            if (result.status === 'success') {
                return result.result;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Solver error:', error);
            throw error;
        }
    }

    /**
     * Complex number operations (REQ-004)
     */
    performComplexOperation(operation, ...numbers) {
        switch (operation) {
            case 'add':
                return this.addComplex(...numbers);
            case 'multiply':
                return this.multiplyComplex(...numbers);
            case 'conjugate':
                return this.conjugateComplex(numbers[0]);
            case 'magnitude':
                return this.magnitudeComplex(numbers[0]);
            case 'phase':
                return this.phaseComplex(numbers[0]);
            default:
                throw new Error(`Unknown complex operation: ${operation}`);
        }
    }

    addComplex(...numbers) {
        return numbers.reduce((sum, num) => {
            const c1 = this.parseComplex(sum);
            const c2 = this.parseComplex(num);
            return {
                real: c1.real + c2.real,
                imag: c1.imag + c2.imag
            };
        });
    }

    multiplyComplex(...numbers) {
        return numbers.reduce((product, num) => {
            const c1 = this.parseComplex(product);
            const c2 = this.parseComplex(num);
            return {
                real: c1.real * c2.real - c1.imag * c2.imag,
                imag: c1.real * c2.imag + c1.imag * c2.real
            };
        });
    }

    parseComplex(value) {
        if (typeof value === 'object' && 'real' in value && 'imag' in value) {
            return value;
        }

        if (typeof value === 'number') {
            return { real: value, imag: 0 };
        }

        if (typeof value === 'string') {
            // Parse string representation like "3+4i" or "2-5j"
            const match = value.match(/^([+-]?\d*\.?\d*)\s*([+-]?\s*\d*\.?\d*)[ij]$/);
            if (match) {
                return {
                    real: parseFloat(match[1]) || 0,
                    imag: parseFloat(match[2].replace(/\s/g, '')) || 1
                };
            }
        }

        throw new Error('Invalid complex number format');
    }

    formatComplex(complex) {
        const { real, imag } = complex;
        if (imag === 0) return real.toString();
        if (real === 0) return `${imag}i`;
        return `${real}${imag >= 0 ? '+' : ''}${imag}i`;
    }

    /**
     * Matrix operations (REQ-005)
     */
    createMatrix(rows, cols, id) {
        const matrix = {
            id: id,
            rows: rows,
            cols: cols,
            data: Array(rows).fill().map(() => Array(cols).fill(0))
        };

        this.matrixEditors.set(id, matrix);
        return matrix;
    }

    updateMatrixCell(matrixId, row, col, value) {
        const matrix = this.matrixEditors.get(matrixId);
        if (matrix) {
            matrix.data[row][col] = this.parseNumber(value);
        }
    }

    async performMatrixOperation(operation, ...matrixIds) {
        const matrices = matrixIds.map(id => {
            const matrix = this.matrixEditors.get(id);
            return matrix ? matrix.data : null;
        }).filter(m => m !== null);

        if (matrices.length === 0) {
            throw new Error('No valid matrices provided');
        }

        try {
            const response = await fetch('/calculations/api/matrix', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: operation,
                    matrices: matrices
                }),
            });

            const result = await response.json();

            if (result.status === 'success') {
                return result.result;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Matrix operation error:', error);
            throw error;
        }
    }

    /**
     * Programming constructs (REQ-007)
     */
    async executeProgrammingBlock(code, language = 'javascript') {
        try {
            // Create safe execution context
            const context = {
                ...this.programmingContext.variables,
                // Add built-in functions
                print: (value) => {
                    this.programmingContext.output.push(String(value));
                },
                plot: async (x, y, options = {}) => {
                    return await this.generatePlot('line', x, y, options);
                },
                solve: async (equation, variable) => {
                    return await this.solveEquation(equation, variable);
                },
                // Math functions
                sin: Math.sin,
                cos: Math.cos,
                tan: Math.tan,
                log: Math.log,
                sqrt: Math.sqrt,
                pi: Math.PI,
                e: Math.E
            };

            // Clear previous output
            this.programmingContext.output = [];

            if (language === 'javascript') {
                // Create function with context
                const func = new Function(...Object.keys(context), code);
                const result = func(...Object.values(context));

                return {
                    success: true,
                    result: result,
                    output: this.programmingContext.output.join('\n')
                };
            } else {
                // For Python, send to backend
                const response = await fetch('/calculations/api/execute_code', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code: code,
                        language: language,
                        variables: this.programmingContext.variables
                    }),
                });

                return await response.json();
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                output: this.programmingContext.output.join('\n')
            };
        }
    }

    /**
     * Variable management (REQ-030)
     */
    declareVariable(name, value, unit = '', description = '') {
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
            throw new Error('Invalid variable name');
        }

        const parsedValue = this.parseNumber(value);

        this.variables.set(name, {
            value: parsedValue,
            unit: unit,
            description: description,
            type: this.getValueType(parsedValue),
            timestamp: Date.now()
        });

        // Update programming context
        this.programmingContext.variables[name] = parsedValue;

        return this.variables.get(name);
    }

    /**
     * Custom functions (REQ-031)
     */
    defineCustomFunction(name, parameters, expression, description = '') {
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
            throw new Error('Invalid function name');
        }

        this.customFunctions.set(name, {
            parameters: parameters,
            expression: expression,
            description: description,
            created: Date.now()
        });

        // Create JavaScript function
        const paramString = parameters.join(', ');
        const func = new Function(paramString, `return ${expression}`);

        // Add to programming context
        this.programmingContext.functions[name] = func;

        return this.customFunctions.get(name);
    }

    /**
     * Generate plot (REQ-008, REQ-009)
     */
    async generatePlot(type, xData, yData, options = {}) {
        try {
            const response = await fetch('/calculations/api/plot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: type,
                    x_data: xData,
                    y_data: yData,
                    title: options.title || 'Plot',
                    x_label: options.xLabel || 'X',
                    y_label: options.yLabel || 'Y',
                    grid: options.grid !== false,
                    legend: options.legend || false,
                    color: options.color || 'blue',
                    style: options.style || '-',
                    marker: options.marker || null,
                    is_3d: options.is3d || false,
                    z_data: options.zData || null
                }),
            });

            const result = await response.json();

            if (result.status === 'success') {
                return result.image_data;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Plot generation error:', error);
            throw error;
        }
    }

    /**
     * Unit conversion (REQ-003)
     */
    async convertUnit(value, fromUnit, toUnit) {
        const cacheKey = `${value}_${fromUnit}_${toUnit}`;

        if (this.unitCache.has(cacheKey)) {
            return this.unitCache.get(cacheKey);
        }

        try {
            const response = await fetch('/calculations/api/convert_unit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    value: value,
                    from_unit: fromUnit,
                    to_unit: toUnit
                }),
            });

            const result = await response.json();

            if (result.status === 'success') {
                this.unitCache.set(cacheKey, result.result);
                return result.result;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Unit conversion error:', error);
            throw error;
        }
    }

    /**
     * Set precision settings (REQ-033)
     */
    setPrecision(settings) {
        this.precisionSettings = { ...this.precisionSettings, ...settings };

        // Update backend
        fetch('/calculations/api/set_precision', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.precisionSettings),
        });
    }

    /**
     * Helper methods
     */
    parseNumber(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            // Handle scientific notation
            const sciMatch = value.match(/^([-+]?\d*\.?\d+)[eE]([-+]?\d+)$/);
            if (sciMatch) {
                return parseFloat(value);
            }

            // Handle complex numbers
            if (value.includes('i') || value.includes('j')) {
                return this.parseComplex(value);
            }

            return parseFloat(value);
        }
        return NaN;
    }

    getValueType(value) {
        if (typeof value === 'number') return 'number';
        if (typeof value === 'object') {
            if ('real' in value && 'imag' in value) return 'complex';
            if (Array.isArray(value)) return 'array';
            if (value.data && Array.isArray(value.data)) return 'matrix';
        }
        return 'unknown';
    }

    formatNumber(value, useUnits = false, unit = '') {
        const { decimalPlaces, outputFormat } = this.precisionSettings;

        let formatted;

        if (typeof value === 'number') {
            if (outputFormat === 'scientific') {
                formatted = value.toExponential(decimalPlaces);
            } else if (outputFormat === 'engineering') {
                const exp = Math.floor(Math.log10(Math.abs(value)) / 3) * 3;
                const mantissa = value / Math.pow(10, exp);
                formatted = `${mantissa.toFixed(decimalPlaces)}e${exp}`;
            } else {
                formatted = value.toFixed(decimalPlaces);
            }
        } else if (typeof value === 'object' && 'real' in value) {
            formatted = this.formatComplex(value);
        } else {
            formatted = String(value);
        }

        if (useUnits && unit) {
            formatted += ` ${unit}`;
        }

        return formatted;
    }
}

// Global calculator engine instance
const calculatorEngine = new CalculatorEngine();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalculatorEngine;
}