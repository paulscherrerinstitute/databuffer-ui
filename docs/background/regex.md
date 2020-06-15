# Working with Regular Expressions

_databuffer UI_ uses PSI's _Data API_ web service, which uses regular expressions when expressing search patterns.

This document will not go into all the details about regular expressions, but show you some common, yet powerful, patterns.

## Quick fix: shell file name patterns

If the name "regular expression" seems daunting, but you feel comfortable with file name patterns, like you use them on a shell, here's the quick fix for you:

| Shell glob | Regex equivalent | Meaning                              |
| ---------- | ---------------- | ------------------------------------ |
| `*`        | `.*`             | Any number of (any) characters       |
| `?`        | `.`              | Any character, but just a single one |
| `.`        | `\\.`            | A literal period                     |

So the shell file name pattern `*.*` would translate to the regular expression `.*\\..*`.

## Special characters

These are the most important characters for use in regular expressions:

| Character                       | Meaning                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `a`...`z`, `A`...`Z`, `0`...`9` | The literal character (letter or number)                                       |
| `^`                             | Beginning of word                                                              |
| `$`                             | End of word                                                                    |
| `?`                             | 0 or 1 time                                                                    |
| `*`                             | 0, 1 or many times                                                             |
| `+`                             | 1 or many times                                                                |
| `.`                             | Any character                                                                  |
| `[...]`                         | Any one of the characters (but just 1 of them, 1 time)                         |
| `(...)`                         | Group the characters (e.g. make entire group optional)                         |
| `\\`                            | Escape the next character (i.e. use it literally, without the special meaning) |

### Examples

| What you write | What it means                                                | Will match | Will not match |
| -------------- | ------------------------------------------------------------ | ---------- | -------------- |
| `a`            | The letter `a`, exactly one time, anywhere in the string     | banana     | book           |
| `a?`           | The letter `a`, zero or one time                             | book       |                |
| `0*[0-9]+`     | An integer number, possibly with leading zeroes              | 007        | book           |
| `a*`           | The letter `a`, zero, one, or many times                     | book       |                |
| `\\.`          | A period character `.`, not any character                    | Good.      | Great!         |
| `a+`           | The letter `a`, one or many times                            | tadaa      | jungle         |
| `a{2,4}`       | The letter `a`, 2, 3, or 4 times (but not 1 time or 5 times) | aaa        | haha           |
| `a|b`          | The letter `a` or the letter `b`                             | book       | forest         |
| `[aeiou]`      | any vowel                                                    | january    | xyz            |

## Pattern 1: Substring search

Just write the substring.

Example: Find all channels, containing _AVG_: `AVG`

## Pattern 2: Beginning of word

Start pattern with `^`.

Example: Find all channels, starting with _SINEG_: `^SINEG`

## Pattern 3: End of word

End pattern with `$`.

Example: Find channels, ending in _CURRENT_ (e.g. not _CURRENT-3-3_ or _CURRENT-5_): `CURRENT$`

## Pattern 4: Substitute characters

Use `.`.

Example: Find channels with substrings _DIA0091_ and _DIA0093_ (or any other 4 characters): `DIA....`

## Pattern 5: Alternatives

Use `|`.

Example: Find channels with _DIA0091_ or _DIA0093_, but not e.g. _DIA0092_: `DIA0091|DIA0093`
