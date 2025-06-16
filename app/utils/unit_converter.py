import pint
import re

# Create a unit registry
ureg = pint.UnitRegistry()


def convert_unit(value, from_unit, to_unit):
    """
    Convert a value from one unit to another

    Args:
        value (float): The value to convert
        from_unit (str): The source unit
        to_unit (str): The target unit

    Returns:
        float: The converted value
    """
    try:
        # Create quantity with original unit
        quantity = value * ureg(from_unit)

        # Convert to target unit
        result = quantity.to(to_unit).magnitude
        return result
    except pint.errors.DimensionalityError:
        raise ValueError(f"Cannot convert from {from_unit} to {to_unit}: incompatible dimensions")
    except Exception as e:
        raise ValueError(f"Unit conversion error: {str(e)}")


def parse_quantity(quantity_str):
    """
    Parse a string containing a number and unit

    Args:
        quantity_str (str): String in the format "value unit" (e.g., "5.2 kg")

    Returns:
        tuple: (value, unit) pair
    """
    # Match a number followed by optional whitespace and any unit
    match = re.match(r'^([-+]?\d*\.?\d+([eE][-+]?\d+)?)\s*(.*)$', quantity_str.strip())

    if match:
        value_str = match.group(1)
        unit_str = match.group(3).strip()

        try:
            value = float(value_str)
            return value, unit_str
        except ValueError:
            raise ValueError(f"Invalid number format: {value_str}")
    else:
        raise ValueError(f"Unable to parse quantity: {quantity_str}")


def evaluate_with_units(expression):
    """
    Evaluate an expression with units

    Args:
        expression (str): Mathematical expression with units

    Returns:
        pint.Quantity: Result with appropriate unit
    """
    # Use eval with the unit registry
    # This is a simplified approach and may not handle all cases correctly
    # For production, a more robust parser would be needed

    try:
        # Replace unit names with ureg.unit to make them accessible in eval
        pattern = r'([0-9.]+)\s*([a-zA-Z°/^*]+)'

        def replace_units(match):
            return f"{match.group(1)} * ureg('{match.group(2)}')"

        modified_expr = re.sub(pattern, replace_units, expression)

        # Add necessary imports to the evaluation environment
        local_vars = {'ureg': ureg, 'np': __import__('numpy')}

        # Evaluate the expression
        result = eval(modified_expr, {"__builtins__": {}}, local_vars)
        return result
    except Exception as e:
        raise ValueError(f"Error evaluating expression with units: {str(e)}")

    def get_compatible_units(unit_str):
        """
        Get a list of compatible units for the given unit

        Args:
            unit_str (str): The unit to find compatible units for

        Returns:
            list: List of compatible unit strings
        """
        try:
            unit = ureg(unit_str)
            dimension = unit.dimensionality

            # Get all units with the same dimensionality
            compatible_units = []
            for u in ureg._units:
                try:
                    if ureg(u).dimensionality == dimension:
                        compatible_units.append(u)
                except:
                    # Skip units that cause errors
                    pass

            return compatible_units
        except Exception as e:
            raise ValueError(f"Error finding compatible units: {str(e)}")

    def create_custom_unit(name, relation, system='custom'):
        """
        Create a custom unit

        Args:
            name (str): Name of the custom unit
            relation (str): Definition relative to existing units (e.g., "1.852 * kilometer")
            system (str): System to register the unit in

        Returns:
            str: Confirmation message
        """
        try:
            # First evaluate the relation to get a quantity
            relation_quantity = evaluate_with_units(relation)

            # Define the new unit
            ureg.define(f'{name} = {relation_quantity.magnitude} * {relation_quantity.units} = {system}')

            return f"Custom unit '{name}' created successfully"
        except Exception as e:
            raise ValueError(f"Error creating custom unit: {str(e)}")

    def get_unit_dimension(unit_str):
        """
        Get the physical dimension of a unit

        Args:
            unit_str (str): The unit to check

        Returns:
            dict: Dimension information
        """
        try:
            unit = ureg(unit_str)
            dimension = unit.dimensionality

            # Convert dimensional mapping to dictionary
            dim_dict = {}
            for dim, power in dimension.items():
                dim_dict[str(dim)] = power

            return {
                'unit': unit_str,
                'dimensions': dim_dict,
                'is_base_unit': len(dim_dict) == 1 and list(dim_dict.values())[0] == 1
            }
        except Exception as e:
            raise ValueError(f"Error getting unit dimension: {str(e)}")

    def check_unit_validity(unit_str):
        """
        Check if a unit string is valid

        Args:
            unit_str (str): The unit string to check

        Returns:
            bool: True if valid, False otherwise
        """
        try:
            ureg(unit_str)
            return True
        except:
            return False

    def common_unit_categories():
        """
        Get a list of common unit categories and examples

        Returns:
            dict: Unit categories and examples
        """
        return {
            'length': ['meter', 'kilometer', 'centimeter', 'millimeter', 'inch', 'foot', 'yard', 'mile'],
            'mass': ['gram', 'kilogram', 'milligram', 'pound', 'ounce', 'ton'],
            'time': ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'],
            'temperature': ['kelvin', 'celsius', 'fahrenheit'],
            'electric_current': ['ampere', 'milliampere', 'kiloampere'],
            'amount_of_substance': ['mole', 'millimole', 'micromole'],
            'luminous_intensity': ['candela'],
            'area': ['square_meter', 'square_kilometer', 'hectare', 'acre', 'square_foot'],
            'volume': ['cubic_meter', 'liter', 'milliliter', 'gallon', 'quart', 'pint', 'cup'],
            'speed': ['meter_per_second', 'kilometer_per_hour', 'mile_per_hour', 'knot'],
            'pressure': ['pascal', 'kilopascal', 'bar', 'atmosphere', 'psi'],
            'energy': ['joule', 'kilojoule', 'calorie', 'kilocalorie', 'watt_hour', 'electron_volt'],
            'power': ['watt', 'kilowatt', 'horsepower'],
            'force': ['newton', 'pound_force', 'kilogram_force'],
            'frequency': ['hertz', 'kilohertz', 'megahertz', 'gigahertz'],
            'angle': ['radian', 'degree', 'arcminute', 'arcsecond'],
            'data': ['bit', 'byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte']
        }