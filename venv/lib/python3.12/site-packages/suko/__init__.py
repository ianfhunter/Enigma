# !/usr/bin/env python3

__version__="0.7"

def __init__():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('-v', '--version', action='version', version='%(prog)s ' + __version__)
    
    subparsers = parser.add_subparsers(title="subcommands", dest="subcommand", help="choose a subcommand:")
    subparsers.add_parser('g', help='[g] generate a suko pattern')
    subparsers.add_parser('f', help='[f] full review with seed')
    subparsers.add_parser('p', help='[p] play mode (hidden seed)')

    import random
    # generator functions
    def generate_random_pattern():
        pattern = list(range(1, 10))
        random.shuffle(pattern)
        return pattern

    def calculate_sums(pattern):
        sums = []
        #Sums for four corners
        for indices in [(0, 1, 3, 4), (1, 2, 4, 5), (3, 4, 6, 7), (4, 5, 7, 8)]:
            sums.append(sum(int(pattern[i]) for i in indices))
        return sums

    def generate_colors():
        # Generate two random numbers between 2 and 5
        color1 = random.randint(2, 5)
        color2 = random.randint(2, 5)
        # Calculate the third number to ensure their sum is equal to 9
        color3 = 9 - color1 - color2
        # Check if the third number is within the valid range
        if 2 <= color3 <= 5:
            return color1, color2, color3
        else:
            # If not, recursively call the function again
            return generate_colors()
    
    # player functions
    def validate_input(user_input):
        if len(user_input) != 9:
            return False
        if not user_input.isdigit():
            return False
        if all(1 <= int(digit) <= 9 for digit in user_input):
            if len(set(user_input)) == 9:
                return True
        return False

    def get_valid_input():
        while True:
            user_input = input("Please enter 9 digits without repetition, between 1 and 9: ")
            if validate_input(user_input):
                return user_input
            # elif user_input == "Q" or user_input == "q": break
            else:
                print("Invalid input. Please try again.")
    
    def check_answer(input_pattern,colors):
        fail = 0
        if int(input_pattern[0])+int(input_pattern[1])+int(input_pattern[3])+int(input_pattern[4])==sums[0]:
            print("1st Sum check: Passed")
        else:
            print("1st Sum check: Failed")
            fail=+1
        if int(input_pattern[1])+int(input_pattern[2])+int(input_pattern[4])+int(input_pattern[5])==sums[1]:
            print("2nd Sum check: Passed")
        else:
            print("2nd Sum check: Failed")
            fail=+1
        if int(input_pattern[3])+int(input_pattern[4])+int(input_pattern[6])+int(input_pattern[7])==sums[2]:
            print("3rd Sum check: Passed")
        else:
            print("3rd Sum check: Failed")
            fail=+1
        if int(input_pattern[4])+int(input_pattern[5])+int(input_pattern[7])+int(input_pattern[8])==sums[3]:
            print("4th Sum check: Passed")
        else:
            print("4th Sum check: Failed")
            fail=+1
        if sum(int(input_pattern[int(i)-1]) for i in sorting_number[:colors[0]])==sum(pattern1[int(digit)-1] for digit in sorting_number[:colors[0]]):
            print("Green   check: Passed")
        else:
            print("Green   check: Failed")
            fail=+1
        if sum(int(input_pattern[int(i)-1]) for i in sorting_number[colors[0]:colors[0]+colors[1]])==sum(pattern1[int(digit)-1] for digit in sorting_number[colors[0]:colors[0]+colors[1]]):
            print("Orange  check: Passed")
        else:
            print("Orange  check: Failed")
            fail=+1
        if sum(int(input_pattern[int(i)-1]) for i in sorting_number[colors[0]+colors[1]:9])==sum(pattern1[int(digit)-1] for digit in sorting_number[colors[0]+colors[1]:9]):
            print("Yellow  check: Passed")
        else:
            print("Yellow  check: Failed")
            fail=+1
        if fail>0:
            print("Not a valid solution.")
        else:
            print("This is a valid solution!")

    args = parser.parse_args()
    if args.subcommand=="g":
            
        pattern1 = generate_random_pattern()
        print("Random Pattern (Answer):", pattern1)

        sums = calculate_sums(pattern1)
        print("Sums:", sums)

        # Generate and print the result as color range
        colors = generate_colors()
        print("Color Range (Green, Orange, Yellow):", colors)

        pattern2 = generate_random_pattern()
        print("Color Pattern:", pattern2)
        sorting_number = ''.join(map(str, pattern2))

        #Sum of Green zone
        print(f"Green :",sum(pattern1[int(digit)-1] for digit in sorting_number[:colors[0]]))
        # Sum of Orange zone
        print(f"Orange:",sum(pattern1[int(digit)-1] for digit in sorting_number[colors[0]:colors[0]+colors[1]]))
        # Sum of Yellow zone
        print(f"Yellow:",sum(pattern1[int(digit)-1] for digit in sorting_number[colors[0]+colors[1]:9]))

    if args.subcommand=="f":
            
        pattern1 = generate_random_pattern()
        print("Random Pattern (Seed):", pattern1)

        sums = calculate_sums(pattern1)
        print("Sums:", sums)

        # Generate and print the result as color range
        colors = generate_colors()
        print("Color Range (Green, Orange, Yellow):", colors)

        pattern2 = generate_random_pattern()
        print("Color Pattern:", pattern2)
        sorting_number = ''.join(map(str, pattern2))

        #Sum of Green zone
        print(f"Green :",sum(pattern1[int(digit)-1] for digit in sorting_number[:colors[0]]))
        # Sum of Orange zone
        print(f"Orange:",sum(pattern1[int(digit)-1] for digit in sorting_number[colors[0]:colors[0]+colors[1]]))
        # Sum of Yellow zone
        print(f"Yellow:",sum(pattern1[int(digit)-1] for digit in sorting_number[colors[0]+colors[1]:9]))

        valid_input = get_valid_input()
        print("Valid input:", valid_input)

        check_answer(valid_input,colors)

    if args.subcommand=="p":
            
        pattern1 = generate_random_pattern()
        # print("Random Pattern (Answer):", pattern1)

        sums = calculate_sums(pattern1)
        print("Sums:", sums)

        # Generate and print the result as color range
        colors = generate_colors()
        print("Color Range (Green, Orange, Yellow):", colors)

        pattern2 = generate_random_pattern()
        print("Color Pattern:", pattern2)
        sorting_number = ''.join(map(str, pattern2))

        #Sum of Green zone
        print(f"Green :",sum(pattern1[int(digit)-1] for digit in sorting_number[:colors[0]]))
        # Sum of Orange zone
        print(f"Orange:",sum(pattern1[int(digit)-1] for digit in sorting_number[colors[0]:colors[0]+colors[1]]))
        # Sum of Yellow zone
        print(f"Yellow:",sum(pattern1[int(digit)-1] for digit in sorting_number[colors[0]+colors[1]:9]))

        valid_input = get_valid_input()
        print("Valid input:", valid_input)

        check_answer(valid_input,colors)
        print("Seed (for reference):", pattern1)

    # print("in __init__ function")