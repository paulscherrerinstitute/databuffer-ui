# Working with Regular Expressions

<div style="padding:1em;border-color:var(--fg);border-width:4px;border-radius:8px;border-style:solid;">

<p style="font-size:150%;font-weight:bold;text-align:center;">⚠️ WORK IN PROGRESS ⚠️</p>

Please note, that this manual, just like version 4 of _databuffer UI_ itself, is still a work in progress.

You'll find lots of places where the manual is yet incomplete, or only holds placeholder content.

</div>

Regular expressions are a way of describing one or more string values using some rules. Many associate regular expressions with the [Perl programming language](https://www.perl.org/), but many programming languages provide means to create and use regular expressions.

## Implementation specifics

Most of the implementations try to be compatible with the very well established Perl syntax for regular expressions. You might see them referred to as _PCRE_: Perl compatible regular expressions. But still, implementation details may create edge cases that send you on a wild goose chase when you simply copy a regular expression from somewhere else.

Things to watch out for when migrating regular expressions between engines:

- Groups (nesting groups, named groups, non-capturing groups, ...)
- Back references (requires capturing groups)
- Look-ahead or look-behind operations
- Single or multi-line matching
- Greediness

## Terminology: Patterns and matches

A _pattern_ is the string representation of a regular expression. It's the rule by which to decide if a string value that is tested for conformity with the regular expression is a match or not.

Some people use _pattern_ and _regular expression_ interchangeably, and using regular expressions is also sometimes referred to as pattern matching.

A _match_ is the part of the value that was tested, that fulfills the condition / rule specified by the pattern.

_Testing_ an input against the pattern is also referred to as _executing_ the regular expression. Some engines allow you to execute a regular expression more than once on the same input, possibly providing multiple matches.
