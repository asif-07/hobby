"""Simple calculator module"""


def add(a, b):
    return a + b


def subtract(a, b):
    return a - b


def multiply(a, b):
    return a * b


def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b


def main():
    print("Simple Calculator")
    try:
        a = float(input("Enter first number: "))
        op = input("Enter operation (+, -, *, /): ")
        b = float(input("Enter second number: "))
    except ValueError:
        print("Invalid input")
        return

    if op == '+':
        result = add(a, b)
    elif op == '-':
        result = subtract(a, b)
    elif op == '*':
        result = multiply(a, b)
    elif op == '/':
        try:
            result = divide(a, b)
        except ValueError as e:
            print(e)
            return
    else:
        print("Unsupported operation")
        return

    print("Result:", result)


if __name__ == "__main__":
    main()
