import numpy as np
import sympy as sp
import matplotlib.pyplot as plt
import matplotlib

matplotlib.use('Agg')  # Use non-interactive backend
import io
import base64
from scipy import optimize, interpolate
import math
import re
from typing import Dict, Any, List, Union, Tuple
import json
from decimal import Decimal, getcontext
import warnings

warnings.filterwarnings('ignore')

# Set high precision for symbolic calculations
getcontext().prec = 50


class EnhancedMathEngine:
    """
    Enhanced mathematical computation engine supporting both symbolic and numeric operations
    Addresses REQ-001, REQ-002, REQ-005, REQ-006, REQ-007, REQ-030
    """

    def __init__(self):
        self.variables = {}
        self.user_functions = {}
        self.precision_settings = {
            'decimal_places': 6,
            'significant_digits': 8,
            'tolerance': 1e-10,
            'output_format': 'auto'  # 'auto', 'decimal', 'scientific', 'engineering'
        }

        # Initialize sympy with custom settings
        sp.init_printing(use_unicode=True)

        # Define common mathematical constants
        self.constants = {
            'pi': sp.pi,
            'e': sp.E,
            'i': sp.I,
            'oo': sp.oo,  # infinity
            'g': 9.80665,  # standard gravity
            'c': 299792458,  # speed of light
            'h': 6.62607015e-34,  # Planck constant
            'k_B': 1.380649e-23,  # Boltzmann constant
            'N_A': 6.02214076e23,  # Avogadro number
            'R': 8.314462618,  # Gas constant
        }

        # Initialize engineering function libraries
        self._init_engineering_functions()

    def _init_engineering_functions(self):
        """Initialize built-in engineering functions (REQ-019, REQ-020)"""

        # Mechanical Engineering Functions
        self.engineering_functions = {
            'stress_normal': lambda F, A: F / A,
            'stress_shear': lambda V, A: V / A,
            'strain': lambda delta_L, L: delta_L / L,
            'youngs_modulus': lambda stress, strain: stress / strain,
            'moment_of_inertia_rectangle': lambda b, h: (b * h ** 3) / 12,
            'moment_of_inertia_circle': lambda r: (sp.pi * r ** 4) / 4,
            'beam_deflection_cantilever': lambda P, L, E, I: (P * L ** 3) / (3 * E * I),
            'beam_deflection_simply_supported': lambda w, L, E, I: (5 * w * L ** 4) / (384 * E * I),

            # Electrical Engineering Functions
            'ohms_law_voltage': lambda I, R: I * R,
            'ohms_law_current': lambda V, R: V / R,
            'ohms_law_resistance': lambda V, I: V / I,
            'power_electrical': lambda V, I: V * I,
            'power_resistive': lambda I, R: I ** 2 * R,
            'impedance_series': lambda *Z: sum(Z),
            'impedance_parallel': lambda *Z: 1 / sum(1 / z for z in Z),
            'capacitive_reactance': lambda f, C: 1 / (2 * sp.pi * f * C),
            'inductive_reactance': lambda f, L: 2 * sp.pi * f * L,

            # Fluid Mechanics Functions
            'reynolds_number': lambda rho, v, L, mu: (rho * v * L) / mu,
            'friction_factor_laminar': lambda Re: 64 / Re,
            'bernoulli_pressure': lambda rho, v1, z1, v2, z2, g=9.81: rho * g * (z1 - z2) + 0.5 * rho * (
                        v1 ** 2 - v2 ** 2),
            'flow_rate_volumetric': lambda A, v: A * v,
            'flow_rate_mass': lambda rho, Q: rho * Q,

            # Thermodynamics Functions
            'ideal_gas_pressure': lambda n, R, T, V: (n * R * T) / V,
            'heat_transfer_conduction': lambda k, A, dT, dx: k * A * dT / dx,
            'heat_transfer_convection': lambda h, A, dT: h * A * dT,
            'thermal_resistance_conduction': lambda dx, k, A: dx / (k * A),
            'thermal_resistance_convection': lambda h, A: 1 / (h * A),

            # Civil Engineering Functions
            'concrete_compression_strength': lambda fc_28, t: fc_28 * (t / (4 + 0.85 * t)),
            'steel_yield_strength': lambda fy, temp_factor=1.0: fy * temp_factor,
            'safety_factor': lambda ultimate_strength, working_stress: ultimate_strength / working_stress,

            # Signal Processing Functions
            'decibel': lambda P, P_ref: 20 * sp.log(P / P_ref, 10),
            'rms': lambda values: sp.sqrt(sum(v ** 2 for v in values) / len(values)),
        }

    def set_precision(self, decimal_places: int = None, significant_digits: int = None,
                      tolerance: float = None, output_format: str = None):
        """Set precision settings for calculations (REQ-033)"""
        if decimal_places is not None:
            self.precision_settings['decimal_places'] = decimal_places
        if significant_digits is not None:
            self.precision_settings['significant_digits'] = significant_digits
        if tolerance is not None:
            self.precision_settings['tolerance'] = tolerance
        if output_format is not None:
            self.precision_settings['output_format'] = output_format

        # Update sympy precision
        getcontext().prec = max(28, significant_digits * 2) if significant_digits else 50

    def format_number(self, value: Union[float, complex, sp.Basic],
                      use_units: bool = False, unit: str = '') -> str:
        """Format numbers according to precision settings (REQ-033)"""
        if isinstance(value, (sp.Basic, sp.Expr)) and not value.is_number:
            return str(value)

        try:
            if isinstance(value, complex):
                real_part = self._format_single_number(value.real)
                imag_part = self._format_single_number(value.imag)
                formatted = f"{real_part} + {imag_part}i" if value.imag >= 0 else f"{real_part} - {abs(imag_part)}i"
            else:
                formatted = self._format_single_number(float(value))

            if use_units and unit:
                formatted += f" {unit}"

            return formatted
        except (TypeError, ValueError):
            return str(value)

    def _format_single_number(self, value: float) -> str:
        """Format a single number according to precision settings"""
        if abs(value) < self.precision_settings['tolerance']:
            return "0"

        format_type = self.precision_settings['output_format']
        decimal_places = self.precision_settings['decimal_places']
        sig_digits = self.precision_settings['significant_digits']

        if format_type == 'scientific':
            return f"{value:.{sig_digits - 1}e}"
        elif format_type == 'engineering':
            exp = int(np.floor(np.log10(abs(value)) / 3)) * 3
            mantissa = value / (10 ** exp)
            return f"{mantissa:.{decimal_places}f}e{exp:+d}"
        elif format_type == 'decimal':
            return f"{value:.{decimal_places}f}"
        else:  # auto format
            if abs(value) >= 1e6 or abs(value) < 1e-3:
                return f"{value:.{sig_digits - 1}e}"
            else:
                return f"{value:.{decimal_places}f}".rstrip('0').rstrip('.')

    def declare_variable(self, name: str, value: Any, unit: str = '',
                         description: str = '', scope: str = 'global') -> Dict[str, Any]:
        """Declare a variable with units and scope (REQ-030)"""
        if not re.match(r'^[a-zA-Z][a-zA-Z0-9_]*$', name):
            raise ValueError(
                "Variable name must start with a letter and contain only letters, numbers, and underscores")

        # Parse and validate the value
        parsed_value = self._parse_value(value)

        variable_info = {
            'value': parsed_value,
            'unit': unit,
            'description': description,
            'scope': scope,
            'type': self._get_value_type(parsed_value),
            'created_at': sp.N(sp.now()),  # Use sympy's now() function
            'symbolic': isinstance(parsed_value, sp.Basic)
        }

        self.variables[name] = variable_info
        return variable_info

    def _parse_value(self, value: Any) -> Any:
        """Parse a value, supporting symbolic expressions"""
        if isinstance(value, str):
            try:
                # Try to parse as symbolic expression first
                return sp.sympify(value, locals=self.constants)
            except:
                try:
                    # Fall back to numeric parsing
                    return float(value)
                except:
                    raise ValueError(f"Cannot parse value: {value}")
        elif isinstance(value, (int, float, complex)):
            return value
        elif isinstance(value, sp.Basic):
            return value
        else:
            raise ValueError(f"Unsupported value type: {type(value)}")

    def _get_value_type(self, value: Any) -> str:
        """Get the type of a value"""
        if isinstance(value, sp.Basic):
            if value.is_real:
                return 'symbolic_real'
            elif value.is_complex:
                return 'symbolic_complex'
            else:
                return 'symbolic_expression'
        elif isinstance(value, complex):
            return 'complex'
        elif isinstance(value, float):
            return 'real'
        elif isinstance(value, int):
            return 'integer'
        else:
            return 'unknown'

    def evaluate_expression(self, expression: str, mode: str = 'auto',
                            variables: Dict = None) -> Dict[str, Any]:
        """
        Evaluate mathematical expressions with both symbolic and numeric support
        (REQ-001, REQ-002, REQ-004)
        """
        if variables is None:
            variables = {}

        # Combine with stored variables
        all_variables = {**self.variables, **variables}

        try:
            # Parse the expression
            expr = sp.sympify(expression, locals={
                **self.constants,
                **{name: var['value'] for name, var in all_variables.items()},
                **self.engineering_functions
            })

            # Determine evaluation mode
            if mode == 'auto':
                # Use symbolic if expression contains undefined symbols or symbolic variables
                mode = 'symbolic' if expr.free_symbols or any(
                    isinstance(var['value'], sp.Basic) and not var['value'].is_number
                    for var in all_variables.values()
                ) else 'numeric'

            if mode == 'symbolic':
                result = expr
                result_type = 'symbolic'
            else:
                # Numeric evaluation
                result = complex(expr.evalf()) if expr.is_complex else float(expr.evalf())
                result_type = 'numeric'

            return {
                'result': result,
                'type': result_type,
                'expression': str(expr),
                'formatted': self.format_number(result),
                'mode': mode,
                'free_symbols': [str(s) for s in expr.free_symbols]
            }

        except Exception as e:
            return {
                'error': str(e),
                'expression': expression,
                'mode': mode
            }

    def solve_equation(self, equation: str, solve_for: str,
                       method: str = 'symbolic') -> Dict[str, Any]:
        """
        Solve algebraic equations symbolically and numerically (REQ-006)
        """
        try:
            # Parse equation
            if '=' in equation:
                left, right = equation.split('=', 1)
                eq = sp.Eq(sp.sympify(left.strip()), sp.sympify(right.strip()))
            else:
                eq = sp.Eq(sp.sympify(equation), 0)

            symbol = sp.Symbol(solve_for)

            if method == 'symbolic':
                solutions = sp.solve(eq, symbol)
            else:
                # Numeric solving using initial guess
                solutions = sp.nsolve(eq.lhs - eq.rhs, symbol, 1.0)
                solutions = [solutions] if not isinstance(solutions, list) else solutions

            formatted_solutions = []
            for sol in solutions:
                formatted_solutions.append({
                    'value': sol,
                    'formatted': self.format_number(sol),
                    'numeric': float(sol.evalf()) if hasattr(sol, 'evalf') else float(sol)
                })

            return {
                'solutions': formatted_solutions,
                'equation': str(eq),
                'variable': solve_for,
                'method': method,
                'count': len(solutions)
            }

        except Exception as e:
            return {
                'error': str(e),
                'equation': equation,
                'variable': solve_for,
                'method': method
            }

    def differentiate(self, expression: str, variable: str, order: int = 1) -> Dict[str, Any]:
        """Symbolic differentiation (REQ-006)"""
        try:
            expr = sp.sympify(expression, locals=self.constants)
            var = sp.Symbol(variable)

            derivative = sp.diff(expr, var, order)

            return {
                'derivative': derivative,
                'formatted': str(derivative),
                'order': order,
                'variable': variable,
                'original': str(expr)
            }

        except Exception as e:
            return {
                'error': str(e),
                'expression': expression,
                'variable': variable,
                'order': order
            }

    def integrate(self, expression: str, variable: str,
                  lower_bound: Any = None, upper_bound: Any = None) -> Dict[str, Any]:
        """Symbolic and numeric integration (REQ-006)"""
        try:
            expr = sp.sympify(expression, locals=self.constants)
            var = sp.Symbol(variable)

            if lower_bound is not None and upper_bound is not None:
                # Definite integral
                lower = sp.sympify(lower_bound)
                upper = sp.sympify(upper_bound)
                result = sp.integrate(expr, (var, lower, upper))
                integral_type = 'definite'
            else:
                # Indefinite integral
                result = sp.integrate(expr, var)
                integral_type = 'indefinite'

            return {
                'integral': result,
                'formatted': str(result),
                'type': integral_type,
                'variable': variable,
                'bounds': [lower_bound, upper_bound] if integral_type == 'definite' else None,
                'original': str(expr),
                'numeric': float(result.evalf()) if result.is_number else None
            }

        except Exception as e:
            return {
                'error': str(e),
                'expression': expression,
                'variable': variable,
                'bounds': [lower_bound, upper_bound]
            }

    def matrix_operations(self, operation: str, *matrices) -> Dict[str, Any]:
        """Matrix and vector operations (REQ-005)"""
        try:
            # Convert input matrices to sympy matrices
            sp_matrices = []
            for matrix in matrices:
                if isinstance(matrix, (list, tuple)):
                    sp_matrices.append(sp.Matrix(matrix))
                elif isinstance(matrix, np.ndarray):
                    sp_matrices.append(sp.Matrix(matrix.tolist()))
                else:
                    sp_matrices.append(matrix)

            if operation == 'multiply':
                result = sp_matrices[0]
                for m in sp_matrices[1:]:
                    result = result * m
            elif operation == 'add':
                result = sp_matrices[0]
                for m in sp_matrices[1:]:
                    result = result + m
            elif operation == 'subtract':
                result = sp_matrices[0] - sp_matrices[1]
            elif operation == 'inverse':
                result = sp_matrices[0].inv()
            elif operation == 'transpose':
                result = sp_matrices[0].T
            elif operation == 'determinant':
                result = sp_matrices[0].det()
            elif operation == 'eigenvalues':
                result = sp_matrices[0].eigenvals()
            elif operation == 'eigenvectors':
                result = sp_matrices[0].eigenvects()
            elif operation == 'rank':
                result = sp_matrices[0].rank()
            elif operation == 'trace':
                result = sp_matrices[0].trace()
            else:
                raise ValueError(f"Unknown matrix operation: {operation}")

            return {
                'result': result,
                'formatted': str(result),
                'operation': operation,
                'input_matrices': len(sp_matrices)
            }

        except Exception as e:
            return {
                'error': str(e),
                'operation': operation,
                'matrices_count': len(matrices)
            }

    def define_function(self, name: str, parameters: List[str],
                        expression: str, description: str = '') -> Dict[str, Any]:
        """Define custom user functions (REQ-007, REQ-025)"""
        try:
            # Validate function name
            if not re.match(r'^[a-zA-Z][a-zA-Z0-9_]*$', name):
                raise ValueError("Function name must start with a letter")

            # Create parameter symbols
            param_symbols = [sp.Symbol(p) for p in parameters]

            # Parse expression
            expr = sp.sympify(expression, locals=dict(zip(parameters, param_symbols)))

            # Create lambda function
            func = sp.lambdify(param_symbols, expr, 'numpy')

            self.user_functions[name] = {
                'parameters': parameters,
                'expression': expr,
                'description': description,
                'lambda_func': func,
                'created_at': sp.N(sp.now())
            }

            return {
                'name': name,
                'parameters': parameters,
                'expression': str(expr),
                'description': description,
                'status': 'created'
            }

        except Exception as e:
            return {
                'error': str(e),
                'name': name,
                'parameters': parameters,
                'expression': expression
            }

    def complex_number_operations(self, operation: str, *numbers) -> Dict[str, Any]:
        """Complex number operations (REQ-004)"""
        try:
            # Convert to sympy complex numbers
            complex_nums = [sp.sympify(str(num)) for num in numbers]

            if operation == 'add':
                result = sum(complex_nums)
            elif operation == 'multiply':
                result = complex_nums[0]
                for num in complex_nums[1:]:
                    result *= num
            elif operation == 'conjugate':
                result = sp.conjugate(complex_nums[0])
            elif operation == 'magnitude':
                result = sp.Abs(complex_nums[0])
            elif operation == 'phase':
                result = sp.arg(complex_nums[0])
            elif operation == 'real':
                result = sp.re(complex_nums[0])
            elif operation == 'imaginary':
                result = sp.im(complex_nums[0])
            elif operation == 'polar':
                magnitude = sp.Abs(complex_nums[0])
                phase = sp.arg(complex_nums[0])
                result = (magnitude, phase)
            else:
                raise ValueError(f"Unknown complex operation: {operation}")

            return {
                'result': result,
                'formatted': str(result),
                'operation': operation,
                'input_count': len(complex_nums)
            }

        except Exception as e:
            return {
                'error': str(e),
                'operation': operation,
                'numbers': numbers
            }

    def curve_fitting(self, x_data: List[float], y_data: List[float],
                      degree: int = 1, method: str = 'polynomial') -> Dict[str, Any]:
        """Curve fitting and regression analysis (REQ-021)"""
        try:
            x_array = np.array(x_data)
            y_array = np.array(y_data)

            if method == 'polynomial':
                coefficients = np.polyfit(x_array, y_array, degree)
                polynomial = np.poly1d(coefficients)

                # Calculate R-squared
                y_pred = polynomial(x_array)
                ss_res = np.sum((y_array - y_pred) ** 2)
                ss_tot = np.sum((y_array - np.mean(y_array)) ** 2)
                r_squared = 1 - (ss_res / ss_tot)

                # Create sympy expression
                x_sym = sp.Symbol('x')
                expr = sum(coef * x_sym ** i for i, coef in enumerate(reversed(coefficients)))

                return {
                    'coefficients': coefficients.tolist(),
                    'expression': str(expr),
                    'r_squared': r_squared,
                    'method': method,
                    'degree': degree,
                    'polynomial': polynomial
                }

            elif method == 'exponential':
                # Fit y = a * exp(b * x)
                log_y = np.log(y_array)
                b, log_a = np.polyfit(x_array, log_y, 1)
                a = np.exp(log_a)

                x_sym = sp.Symbol('x')
                expr = a * sp.exp(b * x_sym)

                return {
                    'parameters': {'a': a, 'b': b},
                    'expression': str(expr),
                    'method': method
                }

            else:
                raise ValueError(f"Unknown fitting method: {method}")

        except Exception as e:
            return {
                'error': str(e),
                'method': method,
                'data_points': len(x_data)
            }


# Global instance for use in Flask app
math_engine = EnhancedMathEngine()