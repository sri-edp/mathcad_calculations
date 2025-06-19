/**
 * Enhanced Unit Converter for Engineering Calculator
 * Implements REQ-003 (automatic unit checking and conversion)
 * Implements REQ-032 (customization of default units)
 */

class EnhancedUnitConverter {
    constructor() {
        this.units = new Map();
        this.conversions = new Map();
        this.userPreferences = new Map();
        this.customUnits = new Map();

        // Initialize unit system
        this.initializeBaseUnits();
        this.initializeDerivedUnits();
        this.initializeConversions();
        this.initializeUserPreferences();
    }

    /**
     * Initialize base SI units and common alternatives
     */
    initializeBaseUnits() {
        const baseUnits = {
            // Length
            'm': {
                name: 'meter',
                symbol: 'm',
                dimension: 'length',
                system: 'SI',
                baseUnit: true,
                factor: 1.0
            },
            'mm': {
                name: 'millimeter',
                symbol: 'mm',
                dimension: 'length',
                system: 'SI',
                baseUnit: false,
                factor: 0.001
            },
            'cm': {
                name: 'centimeter',
                symbol: 'cm',
                dimension: 'length',
                system: 'SI',
                baseUnit: false,
                factor: 0.01
            },
            'km': {
                name: 'kilometer',
                symbol: 'km',
                dimension: 'length',
                system: 'SI',
                baseUnit: false,
                factor: 1000
            },
            'in': {
                name: 'inch',
                symbol: 'in',
                dimension: 'length',
                system: 'Imperial',
                baseUnit: false,
                factor: 0.0254
            },
            'ft': {
                name: 'foot',
                symbol: 'ft',
                dimension: 'length',
                system: 'Imperial',
                baseUnit: false,
                factor: 0.3048
            },
            'yd': {
                name: 'yard',
                symbol: 'yd',
                dimension: 'length',
                system: 'Imperial',
                baseUnit: false,
                factor: 0.9144
            },
            'mile': {
                name: 'mile',
                symbol: 'mi',
                dimension: 'length',
                system: 'Imperial',
                baseUnit: false,
                factor: 1609.344
            },

            // Mass
            'kg': {
                name: 'kilogram',
                symbol: 'kg',
                dimension: 'mass',
                system: 'SI',
                baseUnit: true,
                factor: 1.0
            },
            'g': {
                name: 'gram',
                symbol: 'g',
                dimension: 'mass',
                system: 'SI',
                baseUnit: false,
                factor: 0.001
            },
            'mg': {
                name: 'milligram',
                symbol: 'mg',
                dimension: 'mass',
                system: 'SI',
                baseUnit: false,
                factor: 0.000001
            },
            'lb': {
                name: 'pound',
                symbol: 'lb',
                dimension: 'mass',
                system: 'Imperial',
                baseUnit: false,
                factor: 0.453592
            },
            'oz': {
                name: 'ounce',
                symbol: 'oz',
                dimension: 'mass',
                system: 'Imperial',
                baseUnit: false,
                factor: 0.0283495
            },
            'ton': {
                name: 'metric ton',
                symbol: 't',
                dimension: 'mass',
                system: 'SI',
                baseUnit: false,
                factor: 1000
            },

            // Time
            's': {
                name: 'second',
                symbol: 's',
                dimension: 'time',
                system: 'SI',
                baseUnit: true,
                factor: 1.0
            },
            'ms': {
                name: 'millisecond',
                symbol: 'ms',
                dimension: 'time',
                system: 'SI',
                baseUnit: false,
                factor: 0.001
            },
            'min': {
                name: 'minute',
                symbol: 'min',
                dimension: 'time',
                system: 'Common',
                baseUnit: false,
                factor: 60
            },
            'hr': {
                name: 'hour',
                symbol: 'h',
                dimension: 'time',
                system: 'Common',
                baseUnit: false,
                factor: 3600
            },
            'day': {
                name: 'day',
                symbol: 'd',
                dimension: 'time',
                system: 'Common',
                baseUnit: false,
                factor: 86400
            },

            // Temperature
            'K': {
                name: 'kelvin',
                symbol: 'K',
                dimension: 'temperature',
                system: 'SI',
                baseUnit: true,
                factor: 1.0,
                offset: 0
            },
            'C': {
                name: 'celsius',
                symbol: '°C',
                dimension: 'temperature',
                system: 'Common',
                baseUnit: false,
                factor: 1.0,
                offset: 273.15
            },
            'F': {
                name: 'fahrenheit',
                symbol: '°F',
                dimension: 'temperature',
                system: 'Imperial',
                baseUnit: false,
                factor: 5/9,
                offset: 459.67
            },

            // Electric Current
            'A': {
                name: 'ampere',
                symbol: 'A',
                dimension: 'current',
                system: 'SI',
                baseUnit: true,
                factor: 1.0
            },
            'mA': {
                name: 'milliampere',
                symbol: 'mA',
                dimension: 'current',
                system: 'SI',
                baseUnit: false,
                factor: 0.001
            },
            'kA': {
                name: 'kiloampere',
                symbol: 'kA',
                dimension: 'current',
                system: 'SI',
                baseUnit: false,
                factor: 1000
            }
        };

        for (const [symbol, unit] of Object.entries(baseUnits)) {
            this.units.set(symbol, unit);
        }
    }

    /**
     * Initialize derived units (combinations of base units)
     */
    initializeDerivedUnits() {
        const derivedUnits = {
            // Force
            'N': {
                name: 'newton',
                symbol: 'N',
                dimension: 'force',
                system: 'SI',
                baseUnit: true,
                factor: 1.0,
                derivation: 'kg⋅m/s²'
            },
            'kN': {
                name: 'kilonewton',
                symbol: 'kN',
                dimension: 'force',
                system: 'SI',
                baseUnit: false,
                factor: 1000
            },
            'lbf': {
                name: 'pound-force',
                symbol: 'lbf',
                dimension: 'force',
                system: 'Imperial',
                baseUnit: false,
                factor: 4.44822
            },
            'kip': {
                name: 'kilopound',
                symbol: 'kip',
                dimension: 'force',
                system: 'Imperial',
                baseUnit: false,
                factor: 4448.22
            },

            // Pressure
            'Pa': {
                name: 'pascal',
                symbol: 'Pa',
                dimension: 'pressure',
                system: 'SI',
                baseUnit: true,
                factor: 1.0,
                derivation: 'N/m²'
            },
            'kPa': {
                name: 'kilopascal',
                symbol: 'kPa',
                dimension: 'pressure',
                system: 'SI',
                baseUnit: false,
                factor: 1000
            },
            'MPa': {
                name: 'megapascal',
                symbol: 'MPa',
                dimension: 'pressure',
                system: 'SI',
                baseUnit: false,
                factor: 1000000
            },
            'GPa': {
                name: 'gigapascal',
                symbol: 'GPa',
                dimension: 'pressure',
                system: 'SI',
                baseUnit: false,
                factor: 1000000000
            },
            'psi': {
                name: 'pounds per square inch',
                symbol: 'psi',
                dimension: 'pressure',
                system: 'Imperial',
                baseUnit: false,
                factor: 6894.76
            },
            'bar': {
                name: 'bar',
                symbol: 'bar',
                dimension: 'pressure',
                system: 'Common',
                baseUnit: false,
                factor: 100000
            },
            'atm': {
                name: 'atmosphere',
                symbol: 'atm',
                dimension: 'pressure',
                system: 'Common',
                baseUnit: false,
                factor: 101325
            },

            // Energy
            'J': {
                name: 'joule',
                symbol: 'J',
                dimension: 'energy',
                system: 'SI',
                baseUnit: true,
                factor: 1.0,
                derivation: 'N⋅m'
            },
            'kJ': {
                name: 'kilojoule',
                symbol: 'kJ',
                dimension: 'energy',
                system: 'SI',
                baseUnit: false,
                factor: 1000
            },
            'MJ': {
                name: 'megajoule',
                symbol: 'MJ',
                dimension: 'energy',
                system: 'SI',
                baseUnit: false,
                factor: 1000000
            },
            'cal': {
                name: 'calorie',
                symbol: 'cal',
                dimension: 'energy',
                system: 'Common',
                baseUnit: false,
                factor: 4.184
            },
            'kcal': {
                name: 'kilocalorie',
                symbol: 'kcal',
                dimension: 'energy',
                system: 'Common',
                baseUnit: false,
                factor: 4184
            },
            'BTU': {
                name: 'british thermal unit',
                symbol: 'BTU',
                dimension: 'energy',
                system: 'Imperial',
                baseUnit: false,
                factor: 1055.06
            },
            'kWh': {
                name: 'kilowatt hour',
                symbol: 'kWh',
                dimension: 'energy',
                system: 'Common',
                baseUnit: false,
                factor: 3600000
            },

            // Power
            'W': {
                name: 'watt',
                symbol: 'W',
                dimension: 'power',
                system: 'SI',
                baseUnit: true,
                factor: 1.0,
                derivation: 'J/s'
            },
            'kW': {
                name: 'kilowatt',
                symbol: 'kW',
                dimension: 'power',
                system: 'SI',
                baseUnit: false,
                factor: 1000
            },
            'MW': {
                name: 'megawatt',
                symbol: 'MW',
                dimension: 'power',
                system: 'SI',
                baseUnit: false,
                factor: 1000000
            },
            'hp': {
                name: 'horsepower',
                symbol: 'hp',
                dimension: 'power',
                system: 'Imperial',
                baseUnit: false,
                factor: 745.7
            },

            // Electrical
            'V': {
                name: 'volt',
                symbol: 'V',
                dimension: 'voltage',
                system: 'SI',
                baseUnit: true,
                factor: 1.0
            },
            'mV': {
                name: 'millivolt',
                symbol: 'mV',
                dimension: 'voltage',
                system: 'SI',
                baseUnit: false,
                factor: 0.001
            },
            'kV': {
                name: 'kilovolt',
                symbol: 'kV',
                dimension: 'voltage',
                system: 'SI',
                baseUnit: false,
                factor: 1000
            },
            'ohm': {
                name: 'ohm',
                symbol: 'Ω',
                dimension: 'resistance',
                system: 'SI',
                baseUnit: true,
                factor: 1.0
            },
            'kohm': {
                name: 'kiloohm',
                symbol: 'kΩ',
                dimension: 'resistance',
                system: 'SI',
                baseUnit: false,
                factor: 1000
            },
            'Mohm': {
                name: 'megaohm',
                symbol: 'MΩ',
                dimension: 'resistance',
                system: 'SI',
                baseUnit: false,
                factor: 1000000
            },

            // Frequency
            'Hz': {
                name: 'hertz',
                symbol: 'Hz',
                dimension: 'frequency',
                system: 'SI',
                baseUnit: true,
                factor: 1.0
            },
            'kHz': {
                name: 'kilohertz',
                symbol: 'kHz',
                dimension: 'frequency',
                system: 'SI',
                baseUnit: false,
                factor: 1000
            },
            'MHz': {
                name: 'megahertz',
                symbol: 'MHz',
                dimension: 'frequency',
                system: 'SI',
                baseUnit: false,
                factor: 1000000
            },
            'GHz': {
                name: 'gigahertz',
                symbol: 'GHz',
                dimension: 'frequency',
                system: 'SI',
                baseUnit: false,
                factor: 1000000000
            },

            // Area
            'm2': {
                name: 'square meter',
                symbol: 'm²',
                dimension: 'area',
                system: 'SI',
                baseUnit: true,
                factor: 1.0
            },
            'cm2': {
                name: 'square centimeter',
                symbol: 'cm²',
                dimension: 'area',
                system: 'SI',
                baseUnit: false,
                factor: 0.0001
            },
            'mm2': {
                name: 'square millimeter',
                symbol: 'mm²',
                dimension: 'area',
                system: 'SI',
                baseUnit: false,
                factor: 0.000001
            },
            'km2': {
                name: 'square kilometer',
                symbol: 'km²',
                dimension: 'area',
                system: 'SI',
                baseUnit: false,
                factor: 1000000
            },
            'in2': {
                name: 'square inch',
                symbol: 'in²',
                dimension: 'area',
                system: 'Imperial',
                baseUnit: false,
                factor: 0.00064516
            },
            'ft2': {
                name: 'square foot',
                symbol: 'ft²',
                dimension: 'area',
                system: 'Imperial',
                baseUnit: false,
                factor: 0.092903
            },

            // Volume
            'm3': {
                name: 'cubic meter',
                symbol: 'm³',
                dimension: 'volume',
                system: 'SI',
                baseUnit: true,
                factor: 1.0
            },
            'L': {
                name: 'liter',
                symbol: 'L',
                dimension: 'volume',
                system: 'Common',
                baseUnit: false,
                factor: 0.001
            },
            'mL': {
                name: 'milliliter',
                symbol: 'mL',
                dimension: 'volume',
                system: 'Common',
                baseUnit: false,
                factor: 0.000001
            },
            'gal': {
                name: 'gallon',
                symbol: 'gal',
                dimension: 'volume',
                system: 'Imperial',
                baseUnit: false,
                factor: 0.00378541
            },
            'ft3': {
                name: 'cubic foot',
                symbol: 'ft³',
                dimension: 'volume',
                system: 'Imperial',
                baseUnit: false,
                factor: 0.0283168
            }
        };

        for (const [symbol, unit] of Object.entries(derivedUnits)) {
            this.units.set(symbol, unit);
        }
    }

    /**
     * Initialize conversion functions for complex units
     */
    initializeConversions() {
        // Temperature conversions (non-linear)
        this.conversions.set('temperature', {
            'K_to_C': (k) => k - 273.15,
            'C_to_K': (c) => c + 273.15,
            'K_to_F': (k) => (k - 273.15) * 9/5 + 32,
            'F_to_K': (f) => (f - 32) * 5/9 + 273.15,
            'C_to_F': (c) => c * 9/5 + 32,
            'F_to_C': (f) => (f - 32) * 5/9
        });
    }

    /**
     * Initialize user preferences (REQ-032)
     */
    initializeUserPreferences() {
        const defaultPreferences = {
            length: 'm',
            mass: 'kg',
            time: 's',
            temperature: 'K',
            force: 'N',
            pressure: 'Pa',
            energy: 'J',
            power: 'W',
            current: 'A',
            voltage: 'V',
            resistance: 'ohm',
            frequency: 'Hz',
            area: 'm2',
            volume: 'm3'
        };

        for (const [dimension, unit] of Object.entries(defaultPreferences)) {
            this.userPreferences.set(dimension, unit);
        }
    }

    /**
     * Set user preferences for default units (REQ-032)
     */
    setUserPreferences(preferences) {
        for (const [dimension, unit] of Object.entries(preferences)) {
            if (this.isValidUnit(unit)) {
                const unitData = this.units.get(unit);
                if (unitData) {
                    this.userPreferences.set(dimension, unit);
                }
            }
        }
    }

    /**
     * Get user preference for a dimension
     */
    getUserPreference(dimension) {
        return this.userPreferences.get(dimension) || this.getDefaultUnit(dimension);
    }

    /**
     * Get default unit for a dimension
     */
    getDefaultUnit(dimension) {
        for (const [symbol, unit] of this.units) {
            if (unit.dimension === dimension && unit.baseUnit) {
                return symbol;
            }
        }
        return null;
    }

    /**
     * Main conversion function (REQ-003)
     */
    convert(value, fromUnit, toUnit) {
        if (!this.isValidUnit(fromUnit)) {
            throw new Error(`Invalid source unit: ${fromUnit}`);
        }

        if (!this.isValidUnit(toUnit)) {
            throw new Error(`Invalid target unit: ${toUnit}`);
        }

        if (fromUnit === toUnit) {
            return {
                value: value,
                unit: toUnit,
                conversionFactor: 1.0
            };
        }

        const fromUnitData = this.units.get(fromUnit);
        const toUnitData = this.units.get(toUnit);

        if (fromUnitData.dimension !== toUnitData.dimension) {
            throw new Error(`Cannot convert between different dimensions: ${fromUnitData.dimension} to ${toUnitData.dimension}`);
        }

        let convertedValue;
        let conversionFactor;

        // Handle special cases (temperature, etc.)
        if (fromUnitData.dimension === 'temperature') {
            convertedValue = this.convertTemperature(value, fromUnit, toUnit);
            conversionFactor = 'non-linear';
        } else {
            // Standard linear conversion
            const baseValue = value * fromUnitData.factor;
            convertedValue = baseValue / toUnitData.factor;
            conversionFactor = fromUnitData.factor / toUnitData.factor;
        }

        return {
            value: convertedValue,
            unit: toUnit,
            conversionFactor: conversionFactor,
            originalValue: value,
            originalUnit: fromUnit
        };
    }

    /**
     * Temperature conversion handling
     */
    convertTemperature(value, fromUnit, toUnit) {
        const tempConversions = this.conversions.get('temperature');

        if (fromUnit === 'K' && toUnit === 'C') {
            return tempConversions.K_to_C(value);
        } else if (fromUnit === 'C' && toUnit === 'K') {
            return tempConversions.C_to_K(value);
        } else if (fromUnit === 'K' && toUnit === 'F') {
            return tempConversions.K_to_F(value);
        } else if (fromUnit === 'F' && toUnit === 'K') {
            return tempConversions.F_to_K(value);
        } else if (fromUnit === 'C' && toUnit === 'F') {
            return tempConversions.C_to_F(value);
        } else if (fromUnit === 'F' && toUnit === 'C') {
            return tempConversions.F_to_C(value);
        }

        return value; // Same unit
    }

    /**
     * Parse value with unit from string (REQ-003)
     */
    parseValueWithUnit(input) {
        if (typeof input !== 'string') {
            return { value: parseFloat(input), unit: '' };
        }

        // Enhanced regex to handle scientific notation and various unit formats
        const patterns = [
            /^([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s*([a-zA-ZΩ°²³⁴⁵⁶⁷⁸⁹⁰\/\*\(\)⋅]+)$/,
            /^([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s*$/
        ];

        for (const pattern of patterns) {
            const match = input.trim().match(pattern);
            if (match) {
                return {
                    value: parseFloat(match[1]),
                    unit: match[2] ? match[2].trim() : ''
                };
            }
        }

        throw new Error(`Cannot parse input: ${input}`);
    }

    /**
     * Auto-convert to user preferred units (REQ-032)
     */
    autoConvertToPreferred(value, unit) {
        if (!this.isValidUnit(unit)) {
            return { value, unit, converted: false };
        }

        const unitData = this.units.get(unit);
        const preferredUnit = this.getUserPreference(unitData.dimension);

        if (unit === preferredUnit) {
            return { value, unit, converted: false };
        }

        try {
            const result = this.convert(value, unit, preferredUnit);
            return {
                value: result.value,
                unit: result.unit,
                converted: true,
                originalValue: value,
                originalUnit: unit,
                conversionFactor: result.conversionFactor
            };
        } catch (error) {
            return { value, unit, converted: false, error: error.message };
        }
    }

    /**
     * Get compatible units for a given unit
     */
    getCompatibleUnits(unit) {
        if (!this.isValidUnit(unit)) {
            return [];
        }

        const unitData = this.units.get(unit);
        const compatible = [];

        for (const [symbol, data] of this.units) {
            if (data.dimension === unitData.dimension && symbol !== unit) {
                compatible.push({
                    symbol: symbol,
                    name: data.name,
                    system: data.system,
                    factor: data.factor / unitData.factor
                });
            }
        }

        return compatible.sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Check unit consistency across multiple values
     */
    checkUnitConsistency(values) {
        if (!Array.isArray(values) || values.length === 0) {
            return { consistent: true, message: 'No values to check' };
        }

        const dimensions = new Set();
        const inconsistencies = [];

        for (let i = 0; i < values.length; i++) {
            const { value, unit } = this.parseValueWithUnit(values[i]);

            if (unit && this.isValidUnit(unit)) {
                const unitData = this.units.get(unit);
                dimensions.add(unitData.dimension);

                if (dimensions.size > 1) {
                    inconsistencies.push({
                        index: i,
                        value: values[i],
                        dimension: unitData.dimension
                    });
                }
            }
        }

        return {
            consistent: dimensions.size <= 1,
            dimensions: Array.from(dimensions),
            inconsistencies: inconsistencies,
            message: dimensions.size <= 1 ? 'Units are consistent' : 'Mixed dimensions detected'
        };
    }

    /**
     * Create custom unit (REQ-031)
     */
    createCustomUnit(symbol, name, dimension, factor, baseUnit = null) {
        if (this.units.has(symbol)) {
            throw new Error(`Unit ${symbol} already exists`);
        }

        const customUnit = {
            name: name,
            symbol: symbol,
            dimension: dimension,
            system: 'Custom',
            baseUnit: false,
            factor: factor,
            custom: true,
            created: Date.now()
        };

        this.units.set(symbol, customUnit);
        this.customUnits.set(symbol, customUnit);

        return customUnit;
    }

    /**
     * Remove custom unit
     */
    removeCustomUnit(symbol) {
        if (!this.customUnits.has(symbol)) {
            throw new Error(`Custom unit ${symbol} not found`);
        }

        this.units.delete(symbol);
        this.customUnits.delete(symbol);
    }

    /**
     * Get unit information
     */
    getUnitInfo(unit) {
        if (!this.isValidUnit(unit)) {
            return null;
        }

        const unitData = this.units.get(unit);
        const compatible = this.getCompatibleUnits(unit);

        return {
            ...unitData,
            compatible: compatible,
            isPreferred: this.getUserPreference(unitData.dimension) === unit
        };
    }

    /**
     * Get all units by dimension
     */
    getUnitsByDimension(dimension) {
        const units = [];

        for (const [symbol, data] of this.units) {
            if (data.dimension === dimension) {
                units.push({
                    symbol: symbol,
                    name: data.name,
                    system: data.system,
                    factor: data.factor,
                    baseUnit: data.baseUnit
                });
            }
        }

        return units.sort((a, b) => {
            if (a.baseUnit && !b.baseUnit) return -1;
            if (!a.baseUnit && b.baseUnit) return 1;
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Get all available dimensions
     */
    getAllDimensions() {
        const dimensions = new Set();

        for (const [symbol, data] of this.units) {
            dimensions.add(data.dimension);
        }

        return Array.from(dimensions).sort();
    }

    /**
     * Format conversion result
     */
    formatConversion(result, precision = 6) {
        const formatted = parseFloat(result.value.toPrecision(precision));
        return `${formatted} ${result.unit}`;
    }

    /**
     * Validate unit symbol
     */
    isValidUnit(unit) {
        return this.units.has(unit);
    }

    /**
     * Bulk conversion for arrays
     */
    convertArray(values, fromUnit, toUnit) {
        return values.map(value => {
            try {
                const result = this.convert(value, fromUnit, toUnit);
                return result.value;
            } catch (error) {
                return NaN;
            }
        });
    }

    /**
     * Unit expression evaluation (e.g., "m/s", "kg*m/s^2")
     */
    evaluateUnitExpression(expression) {
        // Simplified unit expression parser
        // In production, would use a more sophisticated parser
        const cleaned = expression.replace(/[\s]/g, '');

        // Handle basic patterns
        if (cleaned.includes('/')) {
            const [numerator, denominator] = cleaned.split('/');
            return {
                numerator: numerator.split('*'),
                denominator: denominator.split('*'),
                expression: expression
            };
        } else if (cleaned.includes('*')) {
            return {
                numerator: cleaned.split('*'),
                denominator: [],
                expression: expression
            };
        } else {
            return {
                numerator: [cleaned],
                denominator: [],
                expression: expression
            };
        }
    }

    /**
     * Get conversion suggestions based on context
     */
    getConversionSuggestions(value, unit, context = 'general') {
        if (!this.isValidUnit(unit)) {
            return [];
        }

        const unitData = this.units.get(unit);
        const compatible = this.getCompatibleUnits(unit);
        const suggestions = [];

        // Add user preferred unit
        const preferred = this.getUserPreference(unitData.dimension);
        if (preferred !== unit) {
            const result = this.convert(value, unit, preferred);
            suggestions.push({
                unit: preferred,
                value: result.value,
                formatted: this.formatConversion(result),
                reason: 'User preference',
                priority: 1
            });
        }

        // Add common conversions based on context
        const contextSuggestions = this.getContextualSuggestions(unitData.dimension, context);
        for (const suggestion of contextSuggestions) {
            if (suggestion !== unit && this.isValidUnit(suggestion)) {
                const result = this.convert(value, unit, suggestion);
                suggestions.push({
                    unit: suggestion,
                    value: result.value,
                    formatted: this.formatConversion(result),
                    reason: 'Common in this context',
                    priority: 2
                });
            }
        }

        // Add base SI unit if not already included
        const baseUnit = this.getDefaultUnit(unitData.dimension);
        if (baseUnit && baseUnit !== unit && !suggestions.find(s => s.unit === baseUnit)) {
            const result = this.convert(value, unit, baseUnit);
            suggestions.push({
                unit: baseUnit,
                value: result.value,
                formatted: this.formatConversion(result),
                reason: 'SI base unit',
                priority: 3
            });
        }

        return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 5);
    }

    /**
     * Get contextual unit suggestions
     */
    getContextualSuggestions(dimension, context) {
        const contexts = {
            'mechanical': {
                'length': ['mm', 'cm', 'in'],
                'force': ['kN', 'lbf'],
                'pressure': ['MPa', 'psi'],
                'mass': ['kg', 'lb']
            },
            'electrical': {
                'voltage': ['V', 'kV', 'mV'],
                'current': ['A', 'mA'],
                'resistance': ['ohm', 'kohm'],
                'power': ['W', 'kW']
            },
            'civil': {
                'length': ['m', 'ft', 'in'],
                'force': ['kN', 'kip'],
                'pressure': ['MPa', 'psi'],
                'area': ['m2', 'ft2']
            },
            'general': {
                'length': ['m', 'cm', 'ft'],
                'mass': ['kg', 'g', 'lb'],
                'time': ['s', 'min', 'hr'],
                'temperature': ['C', 'F', 'K']
            }
        };

        return contexts[context]?.[dimension] || contexts['general'][dimension] || [];
    }

    /**
     * Export user preferences
     */
    exportPreferences() {
        return {
            userPreferences: Object.fromEntries(this.userPreferences),
            customUnits: Object.fromEntries(this.customUnits),
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import user preferences
     */
    importPreferences(data) {
        if (data.userPreferences) {
            for (const [dimension, unit] of Object.entries(data.userPreferences)) {
                if (this.isValidUnit(unit)) {
                    this.userPreferences.set(dimension, unit);
                }
            }
        }

        if (data.customUnits) {
            for (const [symbol, unitData] of Object.entries(data.customUnits)) {
                if (!this.units.has(symbol)) {
                    this.units.set(symbol, unitData);
                    this.customUnits.set(symbol, unitData);
                }
            }
        }
    }

    /**
     * Get unit statistics
     */
    getStatistics() {
        const stats = {
            totalUnits: this.units.size,
            customUnits: this.customUnits.size,
            dimensions: this.getAllDimensions().length,
            systems: {}
        };

        for (const [symbol, data] of this.units) {
            if (!stats.systems[data.system]) {
                stats.systems[data.system] = 0;
            }
            stats.systems[data.system]++;
        }

        return stats;
    }
}

// Global instance
const unitConverter = new EnhancedUnitConverter();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedUnitConverter;
}