# URL parameters for `/preselect`

You can start databuffer UI with a preconfigured plot using the `/preselect` URL. You'll need to specify channels and other information in the [query string](https://en.wikipedia.org/wiki/Query_string).

**Note that values in the query string need to be URI encoded correctly!** See [working with query strings](../topics/query_strings.md) for details.

Parameters are listed in alphabetical order.

## c1 ... c16

You can specify up to 16 channels in parameters `c1` through `c16`. You have to provide a channel using the full channel ID, i.e. `${backend}/${name}`.

Examples:

| Backend              | Channel                        | Parameter value                                         |
| -------------------- | ------------------------------ | ------------------------------------------------------- |
| sf-archiverappliance | SINEG01-CMON-DIA0091:FAN-SPEED | sf-archiverappliance%2FSINEG01-CMON-DIA0091%3AFAN-SPEED |
| proscan-archive      | MMAC2:STR:2                    | proscan-archive%2FMMAC2%3ASTR%3A2                       |

## duration

Duration of the plot in **milliseconds**.

Setting duration will will implicitly set [endTime](#endTime) to "now" and calculate [startTime](#startTime) by subtracting duration from [endTime](#endTime).

**Note:** You **can't mix** the duration and [startTime](#startTime) or [endTime](#endTime) parameters. If parameters [startTime](#startTime) or [endTime](#endTime) are present, they will **take precedence**.

Examples:

| Example             | Parameter value |
| ------------------- | --------------- |
| The last 10 minutes | `600000`        |
| The last 2 hours    | `7200000`       |

## endTime

End time of the plot as an absolute timestamp in one of those formats:

- A **number value** defining the **milliseconds** elapsed since `1970-01-01T00:00:00.000Z` (UTC).
- A **string value** holding a **ISO8601 compliant time string**, e.g. `2020-04-28T12:10:32.048+02:00`.

Examples:

| Example                                      | Parameter value                 |
| -------------------------------------------- | ------------------------------- |
| 10 minutes past noon on April 28th 2020 CEST | `2020-04-28T12:10:00.000+02:00` |
| 10 minutes past noon on April 28th 2020 CEST | `1588068600000`                 |

## startTime

Start time of the plot as an absolute timestamp in one of those formats:

- A **number value** defining the **milliseconds** elapsed since `1970-01-01T00:00:00.000Z` (UTC).
- A **string value** holding a **ISO8601 compliant time string**, e.g. `2020-04-28T12:10:32.048+02:00`.

Examples: See [endTime](#endtime).
