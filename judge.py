#!/usr/bin/env python3
import argparse
import io
import itertools
import random
import sys

def main(input_file, output_file, debug):
    # config output
    h = 100
    w = 100
    n = 200
    jewels = set()
    while len(jewels) < n:
        y = random.randint(0, h - 1)
        x = random.randint(0, w - 1)
        jewels.add(( y, x ))
    print(h, w, n)
    sys.stdout.flush()

    # input file
    input_file.write('{} {} {}\n'.format(h, w, n))
    for y, x in jewels:
        input_file.write('{} {}\n'.format(y, x))

    # config input
    len_p = int(input())
    assert 0 <= len_p <= 500
    p = set()
    for _ in range(len_p):
        dy, dx = map(int, input().split())
        p.add(( dy, dx ))
    y, x = 0, 0
    revealed = [ [ False for _ in range(w) ] for _ in range(w) ]

    # output file
    output_file.write('{}\n'.format(len_p))
    for dy, dx in p:
        output_file.write('{} {}\n'.format(dy, dx))

    debug_first = True
    def debug_print():
        nonlocal debug_first
        if debug_first:
            debug_first = False
        else:
            sys.stderr.buffer.write(b'\x1b[%dA' % h)
            sys.stderr.buffer.write(b'\x1b[%dD' % w)
        for yy in range(h):
            for xx in range(w):
                if ( yy, xx ) == ( y, x ):
                    cc = '@'
                elif ( yy, xx ) in jewels:
                    cc = '*'
                elif ( yy, xx ) in [ ( y + dy, x + dx ) for dy, dx in p ]:
                    cc = '!'
                elif revealed[yy][xx]:
                    cc = '.'
                else:
                    cc = '?'
                print(cc, end='', file=sys.stderr)
            print(file=sys.stderr)

    for move in itertools.count():
        # write
        get = False
        if ( y, x ) in jewels:
            jewels.remove(( y, x ))
            get = True
        close = False
        for dy, dx in p:
            if ( y + dy, x + dx ) in jewels:
                close = True
        if not jewels:
            print('get-clear')
            break
        else:
            print(['', 'get-'][get] + ['far', 'close'][close])
            sys.stdout.flush()

        # update
        revealed[y][x] = True
        if not close:
            for dy, dx in p:
                if 0 <= y + dy < h and 0 <= x + dx < w:
                    revealed[y + dy][x + dx] = True

        # debug
        if debug:
            debug_print()

        # read
        c = input()
        assert c in 'UDRL'
        y += { 'U': -1, 'D': +1 }.get(c, 0)
        x += { 'L': -1, 'R': +1 }.get(c, 0)
        assert 0 <= y < h
        assert 0 <= x < w

        # output file
        output_file.write('{}\n'.format(c))

    print('[*] move:', move, file=sys.stderr)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', default='/dev/null')
    parser.add_argument('--output', default='/dev/null')
    parser.add_argument('--debug', action='store_true')
    args = parser.parse_args()

    main(input_file=open(args.input, 'w'), output_file=open(args.output, 'w'), debug=args.debug)
