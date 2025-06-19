import pint
import re
import json
from typing import Dict, List, Union, Any, Tuple, Optional
from decimal import Decimal
import sympy as sp


class EnhancedUnitConverter:
    """
    Enhanced unit converter supporting automatic unit checking and conversion
    Addresses REQ-003, REQ-032
    """

    def __init__(self):
        # Create unit registry with extended definitions
        self.ureg = pint.UnitRegistry()

        # Add custom engineering units
        self._add_custom_units()

        # Default unit preferences by domain
        self.default_units = {
            'length': 'm',
            'mass': 'kg',
            'time': 's',
            'temperature': 'K',
            'current': 'A',
            'luminous_intensity': 'cd',
            'amount': 'mol',
            'force': 'N',
            'pressure': 'Pa',
            'energy': 'J',
            'power': 'W',
            'frequency': 'Hz',
            'voltage': 'V',
            'resistance': 'ohm',
            'capacitance': 'F',
            'inductance': 'H',
            'angle': 'rad',
            'area': 'm^2',
            'volume': 'm^3',
            'velocity': 'm/s',
            'acceleration': 'm/s^2',
            'density': 'kg/m^3',
            'viscosity': 'Pa*s',
            'thermal_conductivity': 'W/(m*K)',
            'heat_capacity': 'J/(kg*K)',
            'stress': 'Pa',
            'strain': 'dimensionless'
        }

        # User preferences for units
        self.user_preferences = self.default_units.copy()

        # Unit conversion cache for performance
        self._conversion_cache = {}

        # Engineering unit systems
        self.unit_systems = {
            'SI': {
                'length': 'm',
                'mass': 'kg',
                'time': 's',
                'temperature': 'K',
                'force': 'N',
                'pressure': 'Pa',
                'energy': 'J'
            },
            'Imperial': {
                'length': 'ft',
                'mass': 'lb',
                'time': 's',
                'temperature': 'degF',
                'force': 'lbf',
                'pressure': 'psi',
                'energy': 'BTU'
            },
            'CGS': {
                'length': 'cm',
                'mass': 'g',
                'time': 's',
                'temperature': 'K',
                'force': 'dyn',
                'pressure': 'dyn/cm^2',
                'energy': 'erg'
            }
        }

    def _add_custom_units(self):
        """Add custom engineering units to the registry"""
        try:
            # Common engineering units
            self.ureg.define('psi = pound_force_per_square_inch')
            self.ureg.define('ksi = 1000 * psi')
            self.ureg.define('GPa = 1e9 * pascal')
            self.ureg.define('MPa = 1e6 * pascal')
            self.ureg.define('kPa = 1000 * pascal')

            # Thermal units
            self.ureg.define('BTU = british_thermal_unit')
            self.ureg.define('cal = calorie')
            self.ureg.define('kcal = 1000 * calorie')

            # Electrical units
            self.ureg.define('mA = 0.001 * ampere')
            self.ureg.define('kA = 1000 * ampere')
            self.ureg.define('mV = 0.001 * volt')
            self.ureg.define('kV = 1000 * volt')
            self.ureg.define('MV = 1e6 * volt')
            self.ureg.define('mohm = 0.001 * ohm')
            self.ureg.define('kohm = 1000 * ohm')
            self.ureg.define('Mohm = 1e6 * ohm')

            # Flow and velocity units
            self.ureg.define('gpm = gallon / minute')
            self.ureg.define('cfm = foot^3 / minute')
            self.ureg.define('lpm = liter / minute')

            # Additional engineering units
            self.ureg.define('rpm = revolution / minute')
            self.ureg.define('g_force = 9.80665 * meter / second^2')

        except Exception as e:
            print(f"Warning: Could not define custom unit: {e}")

    def set_user_preferences(self, preferences: Dict[str, str]):
        """Set user's preferred units for different quantities (REQ-032)"""
        for quantity, unit in preferences.items():
            if self.is_valid_unit(unit):
                self.user_preferences[quantity] = unit
            else:
                raise ValueError(f"Invalid unit '{unit}' for quantity '{quantity}'")

    def get_user_preference(self, quantity: str) -> str:
        """Get user's preferred unit for a quantity"""
        return self.user_preferences.get(quantity, self.default_units.get(quantity, ''))

    def is_valid_unit(self, unit_str: str) -> bool:
        """Check if a unit string is valid"""
        try:
            self.ureg(unit_str)
            return True
        except:
            return False

    def parse_quantity(self, quantity_str: str) -> Tuple[float, str]:
        """
        Parse a string containing a number and unit
        Returns (value, unit) tuple
        """
        # Enhanced regex to handle scientific notation and complex expressions
        pattern = r'^([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s*(.*)$'
        match = re.match(pattern, quantity_str.strip())

        if match:
            value_str = match.group(1)
            unit_str = match.group(2).strip()

            try:
                value = float(value_str)
                return value, unit_str
            except ValueError:
                raise ValueError(f"Invalid number format: {value_str}")
        else:
            raise ValueError(f"Unable to parse quantity: {quantity_str}")

    def convert_unit(self, value: Union[float, str], from_unit: str,
                     to_unit: str) -> Dict[str, Any]:
        """
        Convert a value from one unit to another with validation
        (REQ-003)
        """
        try:
            # Handle string input with embedded units
            if isinstance(value, str):
                parsed_value, parsed_unit = self.parse_quantity(value)
                if parsed_unit and not from_unit:
                    from_unit = parsed_unit
                value = parsed_value

            # Create cache key
            cache_key = f"{value}_{from_unit}_{to_unit}"
            if cache_key in self._conversion_cache:
                return self._conversion_cache[cache_key]

            # Perform conversion
            source_quantity = value * self.ureg(from_unit)
            converted_quantity = source_quantity.to(to_unit)

            result = {
                'value': float(converted_quantity.magnitude),
                'unit': to_unit,
                'original_value': value,
                'original_unit': from_unit,
                'formatted': f"{converted_quantity.magnitude:.6g} {to_unit}",
                'dimensionality': str(source_quantity.dimensionality),
                'conversion_factor': float(converted_quantity.magnitude / value) if value != 0 else None
            }

            # Cache the result
            self._conversion_cache[cache_key] = result
            return result

        except pint.errors.DimensionalityError as e:
            return {
                'error': f"Incompatible dimensions: cannot convert {from_unit} to {to_unit}",
                'type': 'dimensionality_error',
                'from_unit': from_unit,
                'to_unit': to_unit,
                'value': value
            }
        except Exception as e:
            return {
                'error': str(e),
                'type': 'conversion_error',
                'from_unit': from_unit,
                'to_unit': to_unit,
                'value': value
            }

    def auto_convert_to_preferred(self, value: Union[float, str],
                                  unit: str = '') -> Dict[str, Any]:
        """
        Automatically convert to user's preferred units (REQ-032)
        """
        try:
            # Parse input if it's a string
            if isinstance(value, str):
                parsed_value, parsed_unit = self.parse_quantity(value)
                if parsed_unit:
                    unit = parsed_unit
                value = parsed_value

            if not unit:
                return {'error': 'No unit specified', 'value': value}

            # Get the dimensionality
            quantity = value * self.ureg(unit)
            dimensionality = quantity.dimensionality

            # Find the preferred unit for this dimensionality
            preferred_unit = self._find_preferred_unit_for_dimensionality(dimensionality)

            if preferred_unit and preferred_unit != unit:
                return self.convert_unit(value, unit, preferred_unit)
            else:
                return {
                    'value': value,
                    'unit': unit,
                    'formatted': f"{value:.6g} {unit}",
                    'already_preferred': True
                }

        except Exception as e:
            return {
                'error': str(e),
                'value': value,
                'unit': unit
            }

    def _find_preferred_unit_for_dimensionality(self, dimensionality) -> Optional[str]:
        """Find the user's preferred unit for a given dimensionality"""
        for quantity, unit in self.user_preferences.items():
            try:
                unit_dimensionality = self.ureg(unit).dimensionality
                if unit_dimensionality == dimensionality:
                    return unit
            except:
                continue
        return None

    def check_unit_consistency(self, expressions: List[str]) -> Dict[str, Any]:
        """
        Check unit consistency across multiple expressions (REQ-003)
        """
        try:
            parsed_expressions = []
            dimensionalities = []

            for expr in expressions:
                # Simple parsing - in practice would need more sophisticated expression parsing
                parts = expr.split()
                if len(parts) >= 2:
                    try:
                        value = float(parts[0])
                        unit = ' '.join(parts[1:])
                        quantity = value * self.ureg(unit)
                        parsed_expressions.append({
                            'expression': expr,
                            'value': value,
                            'unit': unit,
                            'dimensionality': quantity.dimensionality
                        })
                        dimensionalities.append(quantity.dimensionality)
                    except:
                        parsed_expressions.append({
                            'expression': expr,
                            'error': 'Could not parse'
                        })

            # Check if all dimensionalities are the same
            unique_dims = list(set(str(d) for d in dimensionalities))
            consistent = len(unique_dims) <= 1

            return {
                'consistent': consistent,
                'expressions': parsed_expressions,
                'unique_dimensionalities': unique_dims,
                'message': 'Units are consistent' if consistent else 'Unit inconsistency detected'
            }

        except Exception as e:
            return {
                'error': str(e),
                'expressions': expressions
            }

    def get_compatible_units(self, unit: str, limit: int = 20) -> List[Dict[str, str]]:
        """Get a list of units compatible with the given unit"""
        try:
            base_quantity = self.ureg(unit)
            target_dimensionality = base_quantity.dimensionality

            compatible = []

            # Search through common units
            common_units = self._get_common_units_list()

            for unit_name in common_units:
                try:
                    test_quantity = self.ureg(unit_name)
                    if test_quantity.dimensionality == target_dimensionality:
                        # Calculate conversion factor
                        converted = base_quantity.to(unit_name)
                        factor = float(converted.magnitude)

                        compatible.append({
                            'unit': unit_name,
                            'name': self._get_unit_name(unit_name),
                            'conversion_factor': factor,
                            'example': f"1 {unit} = {factor:.6g} {unit_name}"
                        })

                        if len(compatible) >= limit:
                            break
                except:
                    continue

            return compatible

        except Exception as e:
            return []

    def _get_common_units_list(self) -> List[str]:
        """Get a list of commonly used units"""
        return [
            # Length
            'm', 'cm', 'mm', 'km', 'in', 'ft', 'yd', 'mile', 'mil', 'micron',
            # Mass
            'kg', 'g', 'mg', 'lb', 'oz', 'ton', 'slug',
            # Time
            's', 'min', 'hr', 'day', 'week', 'month', 'year', 'ms', 'us', 'ns',
            # Force
            'N', 'kN', 'MN', 'lbf', 'kip', 'dyn',
            # Pressure
            'Pa', 'kPa', 'MPa', 'GPa', 'psi', 'ksi', 'bar', 'atm', 'torr', 'mmHg',
            # Energy
            'J', 'kJ', 'MJ', 'cal', 'kcal', 'BTU', 'Wh', 'kWh', 'eV',
            # Power
            'W', 'kW', 'MW', 'hp', 'BTU/hr',
            # Electrical
            'V', 'mV', 'kV', 'A', 'mA', 'kA', 'ohm', 'kohm', 'Mohm',
            'F', 'mF', 'uF', 'nF', 'pF', 'H', 'mH', 'uH', 'nH',
            # Temperature
            'K', 'degC', 'degF', 'degR',
            # Angle
            'rad', 'deg', 'arcmin', 'arcsec', 'rev',
            # Area
            'm^2', 'cm^2', 'mm^2', 'km^2', 'in^2', 'ft^2', 'acre', 'hectare',
            # Volume
            'm^3', 'cm^3', 'mm^3', 'L', 'mL', 'gal', 'qt', 'pt', 'cup', 'ft^3', 'in^3',
            # Velocity
            'm/s', 'km/h', 'mph', 'ft/s', 'knot',
            # Acceleration
            'm/s^2', 'ft/s^2', 'g_force',
            # Frequency
            'Hz', 'kHz', 'MHz', 'GHz', 'rpm',
            # Flow rate
            'm^3/s', 'L/s', 'L/min', 'gpm', 'cfm'
        ]

    def _get_unit_name(self, unit_symbol: str) -> str:
        """Get the full name of a unit from its symbol"""
        unit_names = {
            'm': 'meter', 'cm': 'centimeter', 'mm': 'millimeter', 'km': 'kilometer',
            'in': 'inch', 'ft': 'foot', 'yd': 'yard', 'mile': 'mile',
            'kg': 'kilogram', 'g': 'gram', 'mg': 'milligram', 'lb': 'pound',
            's': 'second', 'min': 'minute', 'hr': 'hour', 'day': 'day',
            'N': 'newton', 'lbf': 'pound-force', 'Pa': 'pascal', 'psi': 'pounds per square inch',
            'J': 'joule', 'cal': 'calorie', 'BTU': 'British thermal unit',
            'W': 'watt', 'hp': 'horsepower', 'V': 'volt', 'A': 'ampere',
            'ohm': 'ohm', 'F': 'farad', 'H': 'henry', 'K': 'kelvin',
            'degC': 'degree Celsius', 'degF': 'degree Fahrenheit',
            'rad': 'radian', 'deg': 'degree', 'Hz': 'hertz'
        }
        return unit_names.get(unit_symbol, unit_symbol)

    def get_unit_system_conversion(self, value: float, unit: str,
                                   target_system: str) -> Dict[str, Any]:
        """Convert units to a specific unit system (SI, Imperial, CGS)"""
        try:
            if target_system not in self.unit_systems:
                return {'error': f"Unknown unit system: {target_system}"}

            # Determine the quantity type
            quantity = value * self.ureg(unit)
            dimensionality = quantity.dimensionality

            # Find the appropriate unit in the target system
            target_unit = None
            for qty_type, sys_unit in self.unit_systems[target_system].items():
                try:
                    sys_quantity = self.ureg(sys_unit)
                    if sys_quantity.dimensionality == dimensionality:
                        target_unit = sys_unit
                        break
                except:
                    continue

            if target_unit:
                return self.convert_unit(value, unit, target_unit)
            else:
                return {
                    'error': f"No equivalent unit found in {target_system} system",
                    'dimensionality': str(dimensionality)
                }

        except Exception as e:
            return {
                'error': str(e),
                'value': value,
                'unit': unit,
                'target_system': target_system
            }

    def evaluate_expression_with_units(self, expression: str) -> Dict[str, Any]:
        """
        Evaluate mathematical expressions containing units
        Integrates with the enhanced math engine (REQ-003)
        """
        try:
            # Use pint's capability to evaluate expressions
            result_quantity = self.ureg.parse_expression(expression)

            return {
                'result': float(result_quantity.magnitude),
                'unit': str(result_quantity.units),
                'dimensionality': str(result_quantity.dimensionality),
                'formatted': f"{result_quantity.magnitude:.6g} {result_quantity.units}",
                'expression': expression
            }

        except Exception as e:
            return {
                'error': str(e),
                'expression': expression
            }

    def create_custom_unit(self, name: str, definition: str,
                           description: str = '') -> Dict[str, Any]:
        """Create a custom unit definition (REQ-031)"""
        try:
            # Validate the definition by trying to create the unit
            test_quantity = self.ureg.parse_expression(definition)

            # Define the new unit
            unit_definition = f"{name} = {definition}"
            if description:
                unit_definition += f" = {description}"

            self.ureg.define(unit_definition)

            return {
                'name': name,
                'definition': definition,
                'description': description,
                'dimensionality': str(test_quantity.dimensionality),
                'status': 'created'
            }

        except Exception as e:
            return {
                'error': str(e),
                'name': name,
                'definition': definition
            }

    def get_unit_info(self, unit: str) -> Dict[str, Any]:
        """Get detailed information about a unit"""
        try:
            quantity = self.ureg(unit)

            return {
                'unit': unit,
                'dimensionality': str(quantity.dimensionality),
                'base_units': str(quantity.to_base_units()),
                'magnitude': 1.0,
                'is_base_unit': len(quantity.dimensionality) == 1,
                'compatible_units': [u['unit'] for u in self.get_compatible_units(unit, 10)]
            }

        except Exception as e:
            return {
                'error': str(e),
                'unit': unit
            }


# Global instance for use in Flask app
unit_converter = EnhancedUnitConverter()