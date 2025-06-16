import numpy as np
import sympy as sp
import matplotlib.pyplot as plt
import io
import base64
from scipy import optimize
import math
import re
from app.utils.unit_converter import ureg, convert_unit, parse_quantity


def evaluate_expression(expression, variables=None):
    """
    Evaluate a mathematical expression with the given variables

    Args:
        expression (str): The mathematical expression to evaluate
        variables (dict): Dictionary of variable names and their values

    Returns:
        dict: Result value, unit, and formatted display
    """
    if variables is None:
        variables = {}

    # Process variables to extract unit information
    processed_vars = {}
    units = {}

    for name, var_data in variables.items():
        if isinstance(var_data, dict) and 'value' in var_data:
            # Extract value and unit separately
            value = var_data['value']
            unit = var_data.get('unit', '')

            # Store unit information
            if unit:
                units[name] = unit

            # Store processed value
            processed_vars[name] = float(value) if is_numeric(value) else value
        else:
            # Direct value assignment
            processed_vars[name] = var_data

    # Try to evaluate with unit handling first
    try:
        return evaluate_with_unit_tracking(expression, processed_vars, units)
    except Exception as ex:
        # Fall back to sympy evaluation if unit handling fails
        expr = sp.sympify(expression)
        symbols = expr.free_symbols

        # If all symbols have values, evaluate numerically
        if all(symbol.name in processed_vars for symbol in symbols):
            # Substitute values and evaluate
            subs_dict = {sp.Symbol(name): value for name, value in processed_vars.items()}
            result = float(expr.subs(subs_dict))
            return {
                'value': result,
                'unit': None,
                'formatted': str(result)
            }
        else:
            # Return symbolic expression
            return {
                'value': expr,
                'unit': None,
                'formatted': str(expr)
            }


def evaluate_with_unit_tracking(expression, variables, units_dict):
    """
    Evaluate an expression with unit tracking

    Args:
        expression (str): Math expression to evaluate
        variables (dict): Variables with their numeric values
        units_dict (dict): Units for each variable

    Returns:
        dict: Result with value, unit, and formatted display
    """
    # Create local variables dictionary with unit objects
    local_vars = {'ureg': ureg}

    # Add variables with units to local vars
    for name, value in variables.items():
        if name in units_dict and units_dict[name]:
            # Add with unit
            unit_str = units_dict[name]
            local_vars[name] = value * ureg(unit_str)
        else:
            # Add without unit
            local_vars[name] = value

    # Prepare expression for evaluation with units
    unit_expr = expression

    # Replace variable names that have units with their unit-aware notation
    for name in variables:
        if name in units_dict and units_dict[name]:
            # Only replace whole words (not parts of other variables)
            pattern = r'\b{}\b'.format(name)
            unit_expr = re.sub(pattern, f'({name})', unit_expr)

    # Evaluate the expression
    result = eval(unit_expr, {"__builtins__": {}}, local_vars)

    # Process the result
    if hasattr(result, 'magnitude') and hasattr(result, 'units'):
        # Result has units (it's a pint Quantity)
        return {
            'value': float(result.magnitude),
            'unit': str(result.units),
            'formatted': str(result)
        }
    else:
        # Plain numeric result
        return {
            'value': float(result) if is_numeric(result) else result,
            'unit': None,
            'formatted': str(result)
        }


def is_numeric(value):
    """Check if a value is numeric"""
    try:
        float(value)
        return True
    except (TypeError, ValueError):
        return False


def solve_equation(equation, solving_for, variables=None):
    """
    Solve an equation for the specified variable

    Args:
        equation (str): The equation to solve (e.g., "x + y = 10")
        solving_for (str): The variable to solve for
        variables (dict): Dictionary of variable names and their values

    Returns:
        list: Solutions to the equation with units if applicable
    """
    if variables is None:
        variables = {}

    # Process variables and extract unit information
    processed_vars = {}
    units = {}

    for name, var_data in variables.items():
        if isinstance(var_data, dict) and 'value' in var_data:
            # Extract value and unit separately
            value = var_data['value']
            unit = var_data.get('unit', '')

            # Store unit information
            if unit:
                units[name] = unit

            # Store processed value
            processed_vars[name] = float(value) if is_numeric(value) else value
        else:
            # Direct value assignment
            processed_vars[name] = var_data

    # Parse the left and right sides of the equation
    if '=' in equation:
        left_side, right_side = equation.split('=')
        left_expr = sp.sympify(left_side.strip())
        right_expr = sp.sympify(right_side.strip())
        expr = left_expr - right_expr
    else:
        # If no equals sign, assume equation is set to zero
        expr = sp.sympify(equation)

    # Create symbol for the variable to solve for
    symbol = sp.Symbol(solving_for)

    # Substitute known variables
    subs_dict = {sp.Symbol(name): value for name, value in processed_vars.items() if name != solving_for}
    expr = expr.subs(subs_dict)

    # Solve the equation
    solutions = sp.solve(expr, symbol)

    # Convert solutions to float when possible and add unit information
    result = []

    # Determine the unit for the result, if any
    result_unit = infer_unit_for_variable(solving_for, equation, units)

    for sol in solutions:
        try:
            value = float(sol)
            # Add unit information if applicable
            if result_unit:
                result.append({
                    'value': value,
                    'unit': result_unit,
                    'formatted': f"{value} {result_unit}"
                })
            else:
                result.append({
                    'value': value,
                    'unit': None,
                    'formatted': str(value)
                })
        except (TypeError, ValueError):
            # For symbolic solutions
            result.append({
                'value': str(sol),
                'unit': result_unit,
                'formatted': f"{str(sol)} {result_unit}" if result_unit else str(sol)
            })

    return result


def infer_unit_for_variable(variable, equation, known_units):
    """
    Attempt to infer the unit for a variable based on the equation and known units

    This is a simplified implementation that tries to maintain unit consistency
    For a complete solution, would need to implement dimensional analysis

    Args:
        variable (str): Variable to find unit for
        equation (str): The equation being solved
        known_units (dict): Units for known variables

    Returns:
        str: Inferred unit or None if cannot be determined
    """
    # This is a placeholder for a more sophisticated unit inference system
    # A proper implementation would analyze the equation and perform dimensional analysis

    # For now, we'll return None, but this would be where unit inference logic goes
    return None


def generate_plot(plot_type, x_data, y_data, title='Plot', x_label='X', y_label='Y'):
    """
    Generate a plot and return as base64 encoded image

    Args:
        plot_type (str): Type of plot ('line', 'scatter', 'bar')
        x_data (list): X-axis data
        y_data (list): Y-axis data
        title (str): Plot title
        x_label (str): X-axis label
        y_label (str): Y-axis label

    Returns:
        str: Base64 encoded image data
    """
    plt.figure(figsize=(10, 6))

    if plot_type == 'line':
        plt.plot(x_data, y_data)
    elif plot_type == 'scatter':
        plt.scatter(x_data, y_data)
    elif plot_type == 'bar':
        plt.bar(x_data, y_data)
    else:
        plt.plot(x_data, y_data)  # Default to line plot

    plt.title(title)
    plt.xlabel(x_label)
    plt.ylabel(y_label)
    plt.grid(True)

    # Save plot to a bytes buffer
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', dpi=100)
    buffer.seek(0)

    # Encode the image to base64
    image_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    plt.close()

    return f"data:image/png;base64,{image_data}"


def differentiate(expression, variable, order=1):
    """
    Differentiate an expression with respect to a variable

    Args:
        expression (str): The expression to differentiate
        variable (str): The variable to differentiate with respect to
        order (int): The order of differentiation

    Returns:
        dict: Differentiated expression with value, unit and formatted display
    """
    expr = sp.sympify(expression)
    var = sp.Symbol(variable)

    result = sp.diff(expr, var, order)

    # Unit handling for differentiation:
    # d/dx of y will have units of [y]/[x]
    return {
        'value': result,
        'unit': None,  # Would need unit handling based on dimensional analysis
        'formatted': str(result)
    }


def integrate(expression, variable, lower_bound=None, upper_bound=None):
    """
    Integrate an expression with respect to a variable

    Args:
        expression (str): The expression to integrate
        variable (str): The variable to integrate with respect to
        lower_bound: Lower bound for definite integral (optional)
        upper_bound: Upper bound for definite integral (optional)

    Returns:
        dict: Integrated expression with value, unit and formatted display
    """
    expr = sp.sympify(expression)
    var = sp.Symbol(variable)

    if lower_bound is not None and upper_bound is not None:
        # Definite integral
        lower = sp.sympify(lower_bound)
        upper = sp.sympify(upper_bound)
        result = sp.integrate(expr, (var, lower, upper))
    else:
        # Indefinite integral
        result = sp.integrate(expr, var)

    # Unit handling for integration:
    # ∫ y dx will have units of [y]*[x]
    return {
        'value': result,
        'unit': None,  # Would need unit handling based on dimensional analysis
        'formatted': str(result)
    }


def optimize_function(expression, variable, method='minimize', bounds=None):
    """
    Find the minimum or maximum of a function

    Args:
        expression (str): The expression to optimize
        variable (str): The variable to optimize for
        method (str): 'minimize' or 'maximize'
        bounds (tuple): (lower, upper) bounds for the variable

    Returns:
        dict: The optimum point and value with units if applicable
    """
    expr = sp.sympify(expression)
    var = sp.Symbol(variable)

    # Convert sympy expression to numpy function
    f = sp.lambdify(var, expr, "numpy")

    if method == 'maximize':
        # Negate the function for maximization
        def obj_func(x):
            return -1 * f(x)
    else:
        obj_func = f

    if bounds:
        result = optimize.minimize_scalar(obj_func, bounds=bounds, method='bounded')
    else:
        result = optimize.minimize_scalar(obj_func)

    x_opt = result.x

    if method == 'maximize':
        f_opt = -1 * result.fun
    else:
        f_opt = result.fun

    return {
        'x': float(x_opt),
        'value': float(f_opt),
        'unit': None,  # Would need unit information
        'success': result.success,
        'formatted': f"x = {x_opt}, value = {f_opt}"
    }