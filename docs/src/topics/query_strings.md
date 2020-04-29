# Working with Query Strings

With HTTP there are two ways to pass information to a URL endpoint: One is in the payload (or "body") of a HTTP request, another is in the _query string_. Not all types of HTTP requests can use both methods, i.e. HTTP requests using the _GET method_ have no payload and can hence only use query strings.

The query string is the part of an "internet address" that follows the question mark `?`. Everything after the question mark is part of the query string. What can be put there has to follow certain rules.

## Quick summary

For the impatient, or those who just need a quick refresher, here's the nitty gritty:

- URL endpoint and query string are separated by `?` (e.g. `/hello?name=world`).
- The query string is made up of a series of parameters, which are specified as key-value-pairs, separated by `=` (e.g. `name=world`).
- The parameters are separated from each other with an ampersand `&` (e.g. `weather=sunny&mood=happy`).
- Some characters (e.g. `/`, `&` and `=`) cannot be used directly, but need to be _escaped_ using so called URI encoding (e.g. `/` becomes `%2F`).

## Percent encoding

Certain characters are used to separate the parts of a query string. That's why certainly they cannot be used as in parameter names or values directly. But there are even more characters, that are not considered "safe" and have been banned from direct usage. Actually [RFC3986](https://tools.ietf.org/html/rfc3986), which defines URIs general syntax, is very conservative. ASCII letters, numbers and a few special characters is all that is allowed without special treatment.

Values that don't fit into that restricted set of allowed characters are _escaped_ or _encoded_ using the percent sign `%` followed by two hexadecimal digits that represent the character's byte value in the ASCII. For a non-ASCII character, typically the UTF-8 representation is used and each byte is percent encoded separately.

Some examples:

| Character | Description                                                | Encoding     |
| --------- | ---------------------------------------------------------- | ------------ |
| %         | Percent sign                                               | %25          |
| /         | Forward slash                                              | %2F          |
| :         | Colon mark                                                 | %3A          |
| =         | Equals sign                                                | %3D          |
| ö         | o Umlaut                                                   | %C3%B6       |
| 😝        | Emoji "face with stuck-out tongue and tightly closed eyes" | %F0%9F%98%9D |

## Keys and values

Technically the query string is passed on to the program receiving it (after the web server) unaltered, and it's up to the software handling the request (e.g. a web framework) to parse and interpret it. So in one interpretation a query string of `name=John&name=Jack` might result in `name` being an array containing the two string values `John` and `Jack`, while another interpretation might follow a strategy of "last write wins" and just sees this parameter `name` as a single string with value `Jack`.

## Further reading

If you're still hungry for knowledge, the following resources might be for you:

- [Wikipedia article on percent encoding](https://en.wikipedia.org/wiki/Percent-encoding)
- [Wikipedia article on query strings](https://en.wikipedia.org/wiki/Query_string)
- [RFC3986: Uniform Resource Identifiers (URIs)](https://tools.ietf.org/html/rfc3986)
